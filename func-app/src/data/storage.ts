/**
 * The storage adapter.
 *
 * Deliberately the smallest interface that can back a document store: get, set,
 * remove. AsyncStorage, MMKV, SQLite-backed KV, a file, or a plain Map all
 * satisfy it, so nothing above this line knows or cares which is in use — and
 * swapping one for another is not a migration.
 *
 * Async throughout, even for adapters that could answer synchronously. MMKV can
 * read synchronously and AsyncStorage cannot; picking the lower common
 * denominator once is better than discovering the difference at stage 4.
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** In-memory adapter for tests and for a dev build with no persistence. */
export class MemoryStorage implements StorageAdapter {
  private readonly map = new Map<string, string>();

  /** Seed a starting state, e.g. a legacy blob a migration test needs. */
  constructor(initial?: Record<string, string>) {
    for (const [k, v] of Object.entries(initial ?? {})) this.map.set(k, v);
  }

  async getItem(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.map.delete(key);
  }

  /** Test helper — what is actually on disk, without going through the store. */
  raw(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  keys(): readonly string[] {
    return [...this.map.keys()];
  }
}

/**
 * An adapter that fails every write.
 *
 * Not a curiosity: a device can be out of space, and a browser in private mode
 * throws on write. The prototype swallowed those in an empty catch, so the app
 * carried on believing it had saved. Tests use this to prove the store surfaces
 * the failure instead.
 */
export class FailingStorage implements StorageAdapter {
  constructor(private readonly message = 'quota exceeded') {}

  async getItem(): Promise<string | null> {
    return null;
  }

  async setItem(): Promise<void> {
    throw new Error(this.message);
  }

  async removeItem(): Promise<void> {
    throw new Error(this.message);
  }
}
