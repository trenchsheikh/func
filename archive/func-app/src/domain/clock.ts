/**
 * Time, as an injected dependency.
 *
 * The domain must never call `Date.now()` directly. DTF expiry is now the rule
 * that decides whether a person's real location is visible to their friends —
 * logic that important has to be testable at an exact instant, not "whenever
 * the test happened to run".
 */

/** Milliseconds since the Unix epoch. */
export type Timestamp = number;

export interface Clock {
  now(): Timestamp;
  /**
   * IANA zone the user is currently in, e.g. 'America/Los_Angeles'.
   *
   * DTF expires at local noon, so "noon" has to mean noon where the user
   * actually is. A traveller must not have their presence expire on the wrong
   * clock — and a world-scale product has travellers by definition.
   */
  timeZone(): string;
}

export const systemClock: Clock = {
  now: () => Date.now(),
  timeZone: () =>
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
};

/** Deterministic clock for tests. */
export function fixedClock(at: Timestamp, timeZone = 'UTC'): Clock {
  return { now: () => at, timeZone: () => timeZone };
}

/** A clock tests can move forward mid-scenario. */
export interface MutableClock extends Clock {
  advanceTo(at: Timestamp): void;
  advanceBy(ms: number): void;
}

export function mutableClock(at: Timestamp, timeZone = 'UTC'): MutableClock {
  let current = at;
  return {
    now: () => current,
    timeZone: () => timeZone,
    advanceTo: (t: Timestamp) => {
      current = t;
    },
    advanceBy: (ms: number) => {
      current += ms;
    },
  };
}

// ---------------------------------------------------------------------------
// Timezone-aware calendar math
//
// Shared by anything that needs "what day is it where the user actually is",
// not UTC's day — DTF expiry (presence.ts) and the 18+ gate (accounts.ts)
// both depend on this, and both need the same answer for the same instant.
// ---------------------------------------------------------------------------

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
}

/** Wall-clock time in `timeZone` at instant `ts`. */
export function zonedParts(ts: Timestamp, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(ts));

  const value = (type: string): number => {
    const found = parts.find((p) => p.type === type);
    return found ? Number(found.value) : 0;
  };

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour') % 24, // some engines report 24 for midnight
    minute: value('minute'),
    second: value('second'),
  };
}
