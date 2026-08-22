/**
 * Local spots and the token economy.
 *
 * Anyone can drop a place worth knowing about; they earn a token when someone
 * else actually goes. This is what gives func something to do on a Tuesday, and
 * it is the one economy in the product — so the counting rules matter.
 *
 * Two guards, both from real bugs: you cannot earn tokens off your own spot,
 * and a visit counts once per person per spot. Otherwise the currency is just a
 * tap counter.
 */

import type { Clock, Timestamp } from './clock';
import type { Coordinates } from './geography';
import type { ActorId, PersonId, SpotId } from './ids';

export interface Spot {
  readonly id: SpotId;
  readonly name: string;
  readonly note: string;
  readonly at: Coordinates;
  readonly droppedBy: ActorId;
  readonly droppedAt: Timestamp;
  /** Count of distinct people who have visited. Derived, never incremented blind. */
  readonly tokens: number;
}

export interface Visit {
  readonly spotId: SpotId;
  readonly personId: PersonId;
  readonly at: Timestamp;
}

export type SpotError = 'own_spot' | 'already_visited' | 'empty_name';

export type SpotResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: SpotError };

export interface DropSpotInput {
  readonly id: SpotId;
  readonly name: string;
  readonly note: string;
  readonly at: Coordinates;
  readonly droppedBy: ActorId;
}

export function dropSpot(input: DropSpotInput, clock: Clock): SpotResult<Spot> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'empty_name' };
  return {
    ok: true,
    value: {
      id: input.id,
      name,
      note: input.note.trim(),
      at: input.at,
      droppedBy: input.droppedBy,
      droppedAt: clock.now(),
      tokens: 0,
    },
  };
}

export function hasVisited(
  visits: readonly Visit[],
  personId: PersonId,
  spotId: SpotId,
): boolean {
  return visits.some((v) => v.personId === personId && v.spotId === spotId);
}

export interface VisitOutcome {
  readonly visit: Visit;
  /** Who the token goes to — null when the dropper is a business. */
  readonly tokenTo: ActorId;
}

/**
 * Record a genuine first visit.
 *
 * Returns `already_visited` rather than silently succeeding, so a caller can
 * tell "counted" from "you have been here before" — the prototype conflated
 * them and reported success either way.
 */
export function visitSpot(
  spot: Spot,
  personId: PersonId,
  visits: readonly Visit[],
  clock: Clock,
): SpotResult<VisitOutcome> {
  if ((spot.droppedBy as string) === (personId as string)) {
    return { ok: false, error: 'own_spot' };
  }
  if (hasVisited(visits, personId, spot.id)) {
    return { ok: false, error: 'already_visited' };
  }
  return {
    ok: true,
    value: {
      visit: { spotId: spot.id, personId, at: clock.now() },
      tokenTo: spot.droppedBy,
    },
  };
}

/**
 * Tokens a spot has earned, counted from the visit log.
 *
 * Derived rather than stored. A stored counter and a visit log can disagree,
 * and when they do the log is the truth.
 */
export function tokensForSpot(spotId: SpotId, visits: readonly Visit[]): number {
  return new Set(visits.filter((v) => v.spotId === spotId).map((v) => v.personId)).size;
}

/** Tokens a person has earned across every spot they dropped. */
export function tokensForPerson(
  personId: ActorId,
  spots: readonly Spot[],
  visits: readonly Visit[],
): number {
  const mine = new Set(
    spots.filter((s) => (s.droppedBy as string) === (personId as string)).map((s) => s.id),
  );
  return visits.filter((v) => mine.has(v.spotId)).length;
}
