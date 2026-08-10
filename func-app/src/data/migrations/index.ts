/**
 * The migration chain.
 *
 * One rule: a schema version bump ships with a migration in the same commit.
 * The prototype's store treated an unrecognised version as a reason to start
 * over, which meant a version bump was indistinguishable from a factory reset.
 * Here an unreachable version is an **error** — the caller decides what to do,
 * and the raw document is preserved either way.
 */

import type { PersistedState } from '../schema';

export interface Migration {
  readonly from: number;
  readonly to: number;
  /** Takes the previous shape as unknown, returns the next one. */
  migrate(state: unknown): unknown;
}

/**
 * Ordered, contiguous, oldest first.
 *
 * The legacy web
 * prototype is not in this chain because it is a different store entirely
 * (a different key, a different shape); it is handled as an import, in
 * `legacy-prototype.ts`.
 */
export const MIGRATIONS: readonly Migration[] = [
  {
    from: 1,
    to: 2,
    // v2 persists last-known location fixes. A v1 document simply has none.
    migrate: (state) => ({ ...(state as object), fixes: {} }),
  },
];

export class MigrationError extends Error {
  constructor(
    message: string,
    readonly fromVersion: number,
    readonly toVersion: number,
  ) {
    super(message);
    this.name = 'MigrationError';
  }
}

/**
 * Walk a document from its version up to the target.
 *
 * Refuses to go backwards. A document written by a newer build than the one
 * running is not something this code can understand, and guessing would
 * silently drop whatever the newer build added — the failure mode the
 * prototype's cross-tab sync warned about but could not prevent.
 */
export function runMigrations(
  state: unknown,
  fromVersion: number,
  toVersion: number,
  migrations: readonly Migration[] = MIGRATIONS,
): PersistedState {
  if (fromVersion === toVersion) return state as PersistedState;

  if (fromVersion > toVersion) {
    throw new MigrationError(
      `Stored data is version ${fromVersion}, newer than this build's ${toVersion}. ` +
        'Refusing to downgrade — update the app rather than losing what it wrote.',
      fromVersion,
      toVersion,
    );
  }

  let current = state;
  let version = fromVersion;

  while (version < toVersion) {
    const step = migrations.find((m) => m.from === version);
    if (!step) {
      throw new MigrationError(
        `No migration from version ${version} to ${version + 1}. The chain has a gap.`,
        fromVersion,
        toVersion,
      );
    }
    current = step.migrate(current);
    version = step.to;
  }

  return current as PersistedState;
}

/** Every version this build can load from. Used by tests to prove no gaps. */
export function migratableVersions(
  targetVersion: number,
  migrations: readonly Migration[] = MIGRATIONS,
): readonly number[] {
  const reachable: number[] = [targetVersion];
  let version = targetVersion;
  for (;;) {
    const step = migrations.find((m) => m.to === version);
    if (!step) break;
    reachable.unshift(step.from);
    version = step.from;
  }
  return reachable;
}
