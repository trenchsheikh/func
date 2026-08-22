/**
 * Presence — being out, and for how long.
 *
 * This replaces the prototype's model, where a person's whereabouts were an
 * authored field (`person.venue`) that only existed while a status was set, and
 * every status rolled over to "not out" 8 hours after it was last touched. The
 * effect was that func could only know you were out if you kept telling it.
 *
 * The model now separates three things the prototype collapsed into one:
 *
 *   1. **Availability** — the traffic light. An explicit statement of intent.
 *   2. **Location** — where the device actually is. A fact about the world.
 *   3. **Sharing permission** — who may see (2), decided in advance.
 *
 * DTF is the switch that connects them: turn it on and your friends can see
 * where you are until it expires, whether or not you open func again. That is
 * the whole point — being out should not require operating an app.
 *
 * Tier 0 still holds. Presence is opt-in, per night, and expires by itself;
 * nobody is on the map without having turned DTF on.
 */

import { zonedParts, type Clock, type Timestamp, type ZonedParts } from './clock';
import type { Coordinates } from './geography';

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

/**
 * The traffic light, per the PRD's canonical definition.
 *
 *   dtf    (green)  — down to func; the only state that shares location
 *   casual (amber)  — looking around, not committing; shares nothing
 *   off    (red)    — not out
 *
 * Premium ("disco ball") is an account property, not a fourth state — it
 * decorates the light rather than replacing it, which is how the prototype
 * treated it too.
 */
export type Presence =
  | { readonly kind: 'off' }
  | {
      readonly kind: 'casual' | 'dtf';
      readonly since: Timestamp;
      /**
       * Always set. Presence that never expires is not presence, it is
       * tracking — and Tier 0 forbids it.
       */
      readonly expiresAt: Timestamp;
    };

export const OFF: Presence = { kind: 'off' };

/**
 * A person's presence plus the settings that govern who may act on it.
 */
export interface PresenceProfile {
  readonly presence: Presence;
  /**
   * Permanent, and deliberately so. Unlike DTF this never expires — it is a
   * standing answer to "may friends-of-friends see me when we are both out?",
   * not a per-night decision.
   *
   * It grants nothing on its own: both people must have it on, *and* both must
   * be DTF, before a mutual sees anything.
   */
  readonly shareWithMutuals: boolean;
}

export const defaultPresenceProfile: PresenceProfile = {
  presence: OFF,
  shareWithMutuals: false,
};

// ---------------------------------------------------------------------------
// Expiry
// ---------------------------------------------------------------------------

/**
 * Default expiry: the next 12:00 in the user's own local time.
 *
 * Nightlife does not respect calendar days. Going out at 9pm Friday and going
 * out at 1am Saturday are the same night, and both should end at the same
 * moment — Saturday midday. "The next occurring noon" expresses that in one
 * rule, with no special-casing of after-midnight.
 *
 * Known edge: switching DTF on between midnight and noon yields a short window
 * (turn it on at 11am and it lasts an hour). That is the correct reading of the
 * rule — you are joining a night already in progress — and the user can extend
 * it with `withExpiry`. Flagged for Phoenix rather than silently patched with a
 * minimum duration he did not ask for.
 */
export function nextLocalNoon(now: Timestamp, timeZone: string): Timestamp {
  const local = zonedParts(now, timeZone);
  let { year, month, day } = local;

  if (local.hour >= 12) {
    // Roll the local calendar date forward one day.
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() + 1);
    year = d.getUTCFullYear();
    month = d.getUTCMonth() + 1;
    day = d.getUTCDate();
  }

  return zonedTimeToUtc({ year, month, day, hour: 12, minute: 0, second: 0 }, timeZone);
}

/** UTC offset in ms for `timeZone` at instant `ts`. */
function offsetAt(ts: Timestamp, timeZone: string): number {
  const p = zonedParts(ts, timeZone);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asIfUtc - Math.floor(ts / 1000) * 1000;
}

/**
 * Convert a wall-clock time in `timeZone` to an absolute instant.
 *
 * Two passes: the first uses the offset at the naive guess, the second
 * re-checks it at the corrected instant. That settles DST boundaries, where the
 * offset before and after the target differ.
 */
function zonedTimeToUtc(parts: ZonedParts, timeZone: string): Timestamp {
  const naive = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const firstPass = naive - offsetAt(naive, timeZone);
  return naive - offsetAt(firstPass, timeZone);
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

/** Turn DTF on. Expires at the next local noon unless told otherwise. */
export function goDtf(clock: Clock, expiresAt?: Timestamp): Presence {
  const now = clock.now();
  return {
    kind: 'dtf',
    since: now,
    expiresAt: expiresAt ?? nextLocalNoon(now, clock.timeZone()),
  };
}

/** Amber. Out and looking, sharing no location. */
export function goCasual(clock: Clock, expiresAt?: Timestamp): Presence {
  const now = clock.now();
  return {
    kind: 'casual',
    since: now,
    expiresAt: expiresAt ?? nextLocalNoon(now, clock.timeZone()),
  };
}

/** Off, immediately. Always available — the user can end the night at any point. */
export function goOff(): Presence {
  return OFF;
}

/**
 * Adjust when presence expires.
 *
 * An expiry at or before now ends it outright, so "set it to a time that has
 * already passed" behaves the same as switching off rather than leaving a
 * zombie state that reads as active.
 */
export function withExpiry(
  presence: Presence,
  expiresAt: Timestamp,
  now: Timestamp,
): Presence {
  if (presence.kind === 'off') return presence;
  if (expiresAt <= now) return OFF;
  return { ...presence, expiresAt };
}

// ---------------------------------------------------------------------------
// Reading presence
// ---------------------------------------------------------------------------

/**
 * Presence as it actually stands at `now`, collapsing anything expired to off.
 *
 * Every read goes through this. The prototype relied on a background timer to
 * write expiry back into storage, which meant a tab that had been asleep — or a
 * device that was simply off — reported stale presence until the timer next
 * fired. For a rule that governs who can see your location, "eventually
 * correct" is not correct.
 */
export function resolvePresence(presence: Presence, now: Timestamp): Presence {
  if (presence.kind === 'off') return presence;
  return now >= presence.expiresAt ? OFF : presence;
}

export function isDtf(profile: PresenceProfile, now: Timestamp): boolean {
  return resolvePresence(profile.presence, now).kind === 'dtf';
}

export function isOut(profile: PresenceProfile, now: Timestamp): boolean {
  return resolvePresence(profile.presence, now).kind !== 'off';
}

/** Milliseconds until presence lapses; 0 if already off. */
export function timeRemaining(presence: Presence, now: Timestamp): number {
  const live = resolvePresence(presence, now);
  return live.kind === 'off' ? 0 : live.expiresAt - now;
}

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

/**
 * A location reading from a device.
 *
 * Held separately from presence on purpose: the device may know where you are
 * while you are not DTF. Whether anyone is *shown* that is decided entirely by
 * `visibility.ts`, never here.
 */
export interface LocationFix {
  readonly at: Coordinates;
  readonly recordedAt: Timestamp;
  /** Horizontal accuracy in metres, if the platform reported it. */
  readonly accuracyMetres: number | null;
}

/**
 * How long a fix stays meaningful.
 *
 * A location an hour old shown as current is a lie with real consequences —
 * someone goes to meet a friend who left long ago. Stale fixes are withheld
 * rather than shown with a caveat.
 */
export const LOCATION_FRESHNESS_MS = 20 * 60 * 1000;

export function isFresh(
  fix: LocationFix,
  now: Timestamp,
  maxAgeMs: number = LOCATION_FRESHNESS_MS,
): boolean {
  const age = now - fix.recordedAt;
  // A fix timestamped in the future is a clock problem, not a fresh reading.
  return age >= 0 && age <= maxAgeMs;
}
