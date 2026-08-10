/**
 * The store.
 *
 * Holds one persisted document, applies domain functions to it, and writes it
 * back. The domain is pure functions over slices of state, so the store's job
 * is narrow on purpose: hand out state, apply a result, persist, notify.
 *
 * Three things the prototype's store got wrong, fixed here:
 *
 *   1. **A version it did not recognise meant "start over."** Now an
 *      unreadable or unreachable document is quarantined under a separate key
 *      and reported, never silently dropped.
 *   2. **Write failures were swallowed by an empty catch,** so the app carried
 *      on believing it had saved. Now they surface.
 *   3. **Every mutation wrote the entire root synchronously.** Writes are now
 *      coalesced, so a burst of changes costs one write rather than ten.
 */

import { emptyState, SCHEMA_VERSION, type PersistedDocument, type PersistedState } from './schema';
import { MigrationError, runMigrations } from './migrations';
import { importLegacy, LEGACY_KEY, looksLikeLegacy } from './migrations/legacy-prototype';
import type { StorageAdapter } from './storage';

export const STORE_KEY = 'func:store';
/** Where an unreadable document is parked instead of being thrown away. */
export const QUARANTINE_KEY = 'func:store:quarantine';

/** How the state on this device came to be — surfaced so it can be reported. */
export type LoadOutcome =
  | { readonly kind: 'fresh' }
  | { readonly kind: 'loaded'; readonly fromVersion: number }
  | { readonly kind: 'migrated'; readonly fromVersion: number }
  | { readonly kind: 'imported_legacy' }
  | { readonly kind: 'quarantined'; readonly reason: string };

export interface StoreOptions {
  readonly storage: StorageAdapter;
  /** Injected so migration behaviour is testable at a fixed instant. */
  readonly now: () => number;
  /**
   * Milliseconds to coalesce writes over. 0 writes immediately, which is what
   * tests want.
   */
  readonly writeDebounceMs?: number;
}

export type Listener = (state: PersistedState) => void;

export class FuncStore {
  private state: PersistedState = emptyState();
  private loaded = false;
  private outcome: LoadOutcome = { kind: 'fresh' };
  private readonly listeners = new Set<Listener>();
  private pendingWrite: ReturnType<typeof setTimeout> | null = null;
  private writeInFlight: Promise<void> = Promise.resolve();
  private lastWriteError: Error | null = null;

  constructor(private readonly options: StoreOptions) {}

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  /**
   * Read from storage, migrating or importing as needed.
   *
   * Never throws for bad data. A document this build cannot understand is
   * copied to the quarantine key and the app starts fresh — but the outcome
   * says so, so the caller can tell the user rather than pretending they are
   * a new user.
   */
  async load(): Promise<LoadOutcome> {
    try {
      return await this.loadInner();
    } catch (error) {
      // The read from storage itself failed — a corrupted native store, a
      // transient device I/O error. There is no raw document to quarantine
      // (we never got far enough to read one), but the app must still start
      // rather than leave `loaded` false forever and every getState() call
      // throwing "before load()" for the rest of the session.
      this.state = emptyState();
      const message = error instanceof Error ? error.message : String(error);
      this.outcome = { kind: 'quarantined', reason: `could not read stored data — ${message}` };
      this.loaded = true;
      return this.outcome;
    }
  }

  private async loadInner(): Promise<LoadOutcome> {
    const raw = await this.options.storage.getItem(STORE_KEY);

    if (raw === null) {
      this.outcome = await this.tryLegacyImport();
      this.loaded = true;
      return this.outcome;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.outcome = await this.quarantine(raw, 'stored data was not valid JSON');
      this.loaded = true;
      return this.outcome;
    }

    const doc = parsed as Partial<PersistedDocument>;
    const version = typeof doc.schemaVersion === 'number' ? doc.schemaVersion : null;

    if (version === null || !doc.state) {
      this.outcome = await this.quarantine(raw, 'stored data had no recognisable version');
      this.loaded = true;
      return this.outcome;
    }

    try {
      this.state = runMigrations(doc.state, version, SCHEMA_VERSION);
      this.outcome =
        version === SCHEMA_VERSION
          ? { kind: 'loaded', fromVersion: version }
          : { kind: 'migrated', fromVersion: version };
      // Persist the migrated shape so the next load has no work to do.
      if (version !== SCHEMA_VERSION) await this.flush();
    } catch (error) {
      const reason =
        error instanceof MigrationError ? error.message : 'migration failed unexpectedly';
      this.outcome = await this.quarantine(raw, reason);
    }

    this.loaded = true;
    return this.outcome;
  }

  private async tryLegacyImport(): Promise<LoadOutcome> {
    const legacyRaw = await this.options.storage.getItem(LEGACY_KEY);
    if (legacyRaw === null) return { kind: 'fresh' };

    try {
      const parsed: unknown = JSON.parse(legacyRaw);
      if (!looksLikeLegacy(parsed)) return { kind: 'fresh' };
      this.state = importLegacy(parsed, this.options.now());
      await this.flush();
      // The legacy key is deliberately left in place. It costs a few kilobytes
      // and it is the only copy of the original; deleting it to tidy up would
      // make the import irreversible if the mapping turns out to be wrong.
      return { kind: 'imported_legacy' };
    } catch {
      return { kind: 'fresh' };
    }
  }

  private async quarantine(raw: string, reason: string): Promise<LoadOutcome> {
    this.state = emptyState();
    try {
      await this.options.storage.setItem(QUARANTINE_KEY, raw);
    } catch {
      // If even the quarantine write fails there is nothing further to try,
      // but the outcome below still tells the caller what happened.
    }
    return { kind: 'quarantined', reason };
  }

  // -------------------------------------------------------------------------
  // Reading and writing
  // -------------------------------------------------------------------------

  getState(): PersistedState {
    if (!this.loaded) {
      throw new Error('FuncStore.getState() before load() — the app would see an empty world.');
    }
    return this.state;
  }

  /** How this device's state came to be. */
  loadOutcome(): LoadOutcome {
    return this.outcome;
  }

  /** The last write failure, if any. Null once a write succeeds. */
  writeError(): Error | null {
    return this.lastWriteError;
  }

  /**
   * Apply a change and persist it.
   *
   * The mutator receives the live state and may modify it in place or return a
   * replacement — both are common when threading domain results back in.
   */
  mutate(fn: (state: PersistedState) => PersistedState | void): void {
    const result = fn(this.state);
    if (result) this.state = result;
    this.notify();
    this.scheduleWrite();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of [...this.listeners]) listener(this.state);
  }

  private scheduleWrite(): void {
    const delay = this.options.writeDebounceMs ?? 0;
    if (delay <= 0) {
      void this.flush();
      return;
    }
    if (this.pendingWrite) clearTimeout(this.pendingWrite);
    this.pendingWrite = setTimeout(() => {
      this.pendingWrite = null;
      void this.flush();
    }, delay);
  }

  /**
   * Write now, waiting for any write already running.
   *
   * Serialised rather than concurrent: two overlapping writes can land out of
   * order, and the loser is a silently stale document on disk.
   */
  async flush(): Promise<void> {
    if (this.pendingWrite) {
      clearTimeout(this.pendingWrite);
      this.pendingWrite = null;
    }
    const write = this.writeInFlight.then(async () => {
      const doc: PersistedDocument = { schemaVersion: SCHEMA_VERSION, state: this.state };
      const before = this.lastWriteError;
      try {
        await this.options.storage.setItem(STORE_KEY, JSON.stringify(doc));
        this.lastWriteError = null;
      } catch (error) {
        this.lastWriteError = error instanceof Error ? error : new Error(String(error));
      }
      // Tell subscribers when the write-error state actually changes — a
      // failure to save must reach the UI, not just sit on a field nothing
      // reads. flush() runs on its own timer, well after the mutate() that
      // triggered it already notified, so this is a second, distinct signal.
      if (before !== this.lastWriteError) this.notify();
    });
    this.writeInFlight = write;
    return write;
  }

  /**
   * Wipe this device's state.
   *
   * Quarantine and the legacy key are left alone — this clears what the app is
   * using, not the record of what it had.
   */
  async reset(): Promise<void> {
    this.state = emptyState();
    this.outcome = { kind: 'fresh' };
    this.notify();
    await this.flush();
  }
}
