import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { asPersonId } from '../../domain/ids';
import { MigrationError, migratableVersions, runMigrations, type Migration } from '../migrations';
import { LEGACY_KEY } from '../migrations/legacy-prototype';
import { emptyState, SCHEMA_VERSION, type PersistedDocument } from '../schema';
import { FuncStore, QUARANTINE_KEY, STORE_KEY } from '../store';
import { FailingStorage, MemoryStorage } from '../storage';

const NOW = Date.parse('2026-08-09T04:00:00Z');
const now = () => NOW;

const store = (storage: MemoryStorage | FailingStorage) =>
  new FuncStore({ storage, now });

const documentAt = (schemaVersion: number, state: unknown): string =>
  JSON.stringify({ schemaVersion, state });

describe('a fresh device', () => {
  it('starts empty and says so', async () => {
    const s = store(new MemoryStorage());
    const outcome = await s.load();
    assert.deepEqual(outcome, { kind: 'fresh' });
    assert.deepEqual(s.getState().requests, []);
  });

  it('refuses to hand out state before loading', () => {
    // Reading early would show an empty world and look like data loss.
    assert.throws(() => store(new MemoryStorage()).getState(), /before load/);
  });
});

describe('a device with data', () => {
  it('loads it back', async () => {
    const state = emptyState();
    state.session.personId = asPersonId('u1');
    const storage = new MemoryStorage({ [STORE_KEY]: documentAt(SCHEMA_VERSION, state) });

    const s = store(storage);
    const outcome = await s.load();
    assert.deepEqual(outcome, { kind: 'loaded', fromVersion: SCHEMA_VERSION });
    assert.equal(s.getState().session.personId, 'u1');
  });

  it('round-trips a mutation', async () => {
    const storage = new MemoryStorage();
    const s = store(storage);
    await s.load();

    s.mutate((state) => {
      state.session.personId = asPersonId('u2');
    });
    await s.flush();

    const reopened = store(storage);
    await reopened.load();
    assert.equal(reopened.getState().session.personId, 'u2');
  });

  it('notifies subscribers, and stops once unsubscribed', async () => {
    const s = store(new MemoryStorage());
    await s.load();

    let calls = 0;
    const unsubscribe = s.subscribe(() => { calls += 1; });
    s.mutate((state) => { state.session.personId = asPersonId('a'); });
    assert.equal(calls, 1);

    unsubscribe();
    s.mutate((state) => { state.session.personId = asPersonId('b'); });
    assert.equal(calls, 1);
  });
});

describe('unreadable data is quarantined, never discarded', () => {
  it('parks invalid JSON and reports why', async () => {
    const storage = new MemoryStorage({ [STORE_KEY]: '{ this is not json' });
    const s = store(storage);
    const outcome = await s.load();

    assert.equal(outcome.kind, 'quarantined');
    assert.match(outcome.kind === 'quarantined' ? outcome.reason : '', /valid JSON/);
    // The original bytes are still there to inspect or recover.
    assert.equal(storage.raw(QUARANTINE_KEY), '{ this is not json');
  });

  it('parks a document with no version', async () => {
    const storage = new MemoryStorage({ [STORE_KEY]: JSON.stringify({ state: {} }) });
    const outcome = await store(storage).load();
    assert.equal(outcome.kind, 'quarantined');
    assert.ok(storage.raw(QUARANTINE_KEY));
  });

  it('refuses to downgrade a document from a newer build', async () => {
    // The prototype's cross-tab sync warned about this and then let the older
    // tab overwrite the newer data anyway.
    const storage = new MemoryStorage({
      [STORE_KEY]: documentAt(SCHEMA_VERSION + 5, emptyState()),
    });
    const outcome = await store(storage).load();
    assert.equal(outcome.kind, 'quarantined');
    assert.match(outcome.kind === 'quarantined' ? outcome.reason : '', /newer than this build/);
    assert.ok(storage.raw(QUARANTINE_KEY));
  });

  it('starts clean after quarantine rather than half-loaded', async () => {
    const storage = new MemoryStorage({ [STORE_KEY]: 'garbage' });
    const s = store(storage);
    await s.load();
    assert.deepEqual(s.getState().requests, []);
    assert.equal(s.getState().session.personId, null);
  });
});

describe('write failures surface', () => {
  it('records the error instead of swallowing it', async () => {
    // The prototype's persist() had an empty catch, so a full disk looked
    // exactly like a successful save.
    const s = store(new FailingStorage('quota exceeded'));
    await s.load();
    s.mutate((state) => { state.session.personId = asPersonId('u1'); });
    await s.flush();

    assert.match(s.writeError()?.message ?? '', /quota exceeded/);
  });

  it('clears the error once a write succeeds', async () => {
    const storage = new MemoryStorage();
    const s = store(storage);
    await s.load();
    await s.flush();
    assert.equal(s.writeError(), null);
  });
});

describe('importing from the frozen web prototype', () => {
  const legacy = JSON.stringify({
    version: 4,
    peopleStatus: { you: { status: 'green', statusSetAt: NOW, statusExpiresAt: NOW + 3600_000 } },
    requests: [],
    accounts: {},
    session: { personId: 'you' },
    newSpots: [], visits: [], newTables: [], newStories: [],
    checkins: [], interest: [], saved: [], venueHeat: {},
    passes: [], threads: [], messages: [], newPeople: [], newBusinesses: [],
  });

  it('picks it up when there is no current document', async () => {
    const storage = new MemoryStorage({ [LEGACY_KEY]: legacy });
    const s = store(storage);
    const outcome = await s.load();

    assert.deepEqual(outcome, { kind: 'imported_legacy' });
    assert.equal(s.getState().session.personId, 'you');
    assert.equal(s.getState().presence['you']?.presence.kind, 'dtf');
  });

  it('writes the imported state so the next launch has no work to do', async () => {
    const storage = new MemoryStorage({ [LEGACY_KEY]: legacy });
    await store(storage).load();

    const second = store(storage);
    assert.deepEqual(await second.load(), { kind: 'loaded', fromVersion: SCHEMA_VERSION });
    assert.equal(second.getState().session.personId, 'you');
  });

  it('leaves the original in place, so the import stays reversible', async () => {
    const storage = new MemoryStorage({ [LEGACY_KEY]: legacy });
    await store(storage).load();
    assert.equal(storage.raw(LEGACY_KEY), legacy);
  });

  it('ignores the legacy key once a current document exists', async () => {
    const state = emptyState();
    state.session.personId = asPersonId('current');
    const storage = new MemoryStorage({
      [LEGACY_KEY]: legacy,
      [STORE_KEY]: documentAt(SCHEMA_VERSION, state),
    });
    const s = store(storage);
    assert.equal((await s.load()).kind, 'loaded');
    assert.equal(s.getState().session.personId, 'current');
  });

  it('starts fresh rather than crashing on a corrupt legacy blob', async () => {
    const storage = new MemoryStorage({ [LEGACY_KEY]: '{ broken' });
    assert.deepEqual(await store(storage).load(), { kind: 'fresh' });
  });
});

describe('the migration chain', () => {
  const bump = (from: number): Migration => ({
    from,
    to: from + 1,
    migrate: (state) => ({ ...(state as object), [`v${from + 1}`]: true }),
  });

  it('is a no-op at the current version', () => {
    const state = emptyState();
    assert.equal(runMigrations(state, 3, 3, []), state);
  });

  it('applies steps in order', () => {
    const result = runMigrations({}, 1, 4, [bump(1), bump(2), bump(3)]) as unknown;
    assert.deepEqual(result, { v2: true, v3: true, v4: true });
  });

  it('refuses a gap rather than guessing', () => {
    assert.throws(() => runMigrations({}, 1, 4, [bump(1), bump(3)]), MigrationError);
  });

  it('refuses to run backwards', () => {
    assert.throws(() => runMigrations({}, 9, 1, []), /Refusing to downgrade/);
  });

  it('reports every version this build can load', () => {
    assert.deepEqual(migratableVersions(4, [bump(1), bump(2), bump(3)]), [1, 2, 3, 4]);
  });

  it('has no gaps in the shipped chain', async () => {
    // Guards the rule that a version bump ships with its migration: if
    // SCHEMA_VERSION moves and nothing is added, this fails.
    const { MIGRATIONS } = await import('../migrations');
    assert.deepEqual(migratableVersions(SCHEMA_VERSION, MIGRATIONS)[0], 1);
    assert.equal(migratableVersions(SCHEMA_VERSION, MIGRATIONS).length, SCHEMA_VERSION);
  });

  it('migrates a stored document on load and saves the result', async () => {
    const storage = new MemoryStorage({ [STORE_KEY]: documentAt(1, emptyState()) });
    const s = new FuncStore({ storage, now });
    const outcome = await s.load();
    // At SCHEMA_VERSION 1 this is a plain load; the assertion is that a v1
    // document is understood at all, which is what the chain guarantees.
    assert.equal(outcome.kind, 'loaded');
    const written = JSON.parse(storage.raw(STORE_KEY) ?? '{}') as PersistedDocument;
    assert.equal(written.schemaVersion, SCHEMA_VERSION);
  });
});

describe('resetting', () => {
  it('clears app state but keeps the record of what was there', async () => {
    const storage = new MemoryStorage({ [LEGACY_KEY]: '{"version":4,"peopleStatus":{},"requests":[]}' });
    const s = store(storage);
    await s.load();
    s.mutate((state) => { state.session.personId = asPersonId('u1'); });
    await s.flush();

    await s.reset();
    assert.equal(s.getState().session.personId, null);
    assert.ok(storage.raw(LEGACY_KEY), 'the original prototype data is still there');
  });
});
