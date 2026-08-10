/**
 * Night rating, saved items, and expressed interest.
 *
 * Small mechanics, grouped because they share one shape: a person acting on
 * something they have seen, feeding back into what the map shows.
 */

import type { Clock, Timestamp } from './clock';
import type { PersonId, SpotId, VenueId } from './ids';
import type { Pass } from './access';

// ---------------------------------------------------------------------------
// Night rating
// ---------------------------------------------------------------------------

/**
 * Rating feeds the map's accuracy. It is not a public review — Tier 0 is
 * explicit that func should not pick a fight with Google Maps, so nothing here
 * is ever attributed or displayed. It moves one number: heat.
 */
export type Stars = 1 | 2 | 3 | 4 | 5;

export function isValidRating(value: number): value is Stars {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

/**
 * How much a rating moves a venue's heat.
 *
 * Carried over from the prototype **unchanged and deliberately**, including its
 * asymmetry: a good night nudges heat up a little, a bad one pulls it down
 * almost three times as hard, and three stars counts as bad.
 *
 * Flagged rather than quietly fixed — three stars reading as a negative signal
 * looks wrong to me, and the asymmetry means a venue's heat decays under
 * mediocre ratings faster than it can recover. Changing it is a product call
 * for Phoenix, not a refactor.
 */
export const HEAT_UP = 0.05;
export const HEAT_DOWN = -0.14;
export const POSITIVE_FROM_STARS = 4;
export const MIN_HEAT = 0.1;
export const MAX_HEAT = 1;

export type RatingError = 'invalid_rating' | 'already_rated' | 'no_pass';

export type RatingResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: RatingError };

export interface RatingOutcome {
  readonly venueId: VenueId;
  readonly newHeat: number;
  readonly pass: Pass;
}

export function heatAfterRating(currentHeat: number, stars: Stars): number {
  const delta = stars >= POSITIVE_FROM_STARS ? HEAT_UP : HEAT_DOWN;
  return Math.max(MIN_HEAT, Math.min(MAX_HEAT, currentHeat + delta));
}

/**
 * The most recent pass the guest has not yet rated.
 *
 * Only the latest is offered. Asking someone to rate a night from three weeks
 * ago is asking them to guess.
 */
export function latestUnratedPass(
  passes: readonly Pass[],
  guestId: PersonId,
): Pass | null {
  const mine = passes
    .filter((p) => p.guestId === guestId)
    .sort((a, b) => b.issuedAt - a.issuedAt);
  const latest = mine[0];
  return latest && !latest.rated ? latest : null;
}

/**
 * Rate a night.
 *
 * Zero stars is not a rating — the prototype's send button submitted a full
 * negative rating when nobody had tapped a star at all. Here it cannot be
 * expressed: `Stars` excludes it and `isValidRating` rejects it.
 */
export function rateNight(
  pass: Pass,
  stars: number,
  currentHeat: number,
): RatingResult<RatingOutcome> {
  if (!isValidRating(stars)) return { ok: false, error: 'invalid_rating' };
  if (pass.rated) return { ok: false, error: 'already_rated' };
  return {
    ok: true,
    value: {
      venueId: pass.venueId,
      newHeat: heatAfterRating(currentHeat, stars),
      pass: { ...pass, rated: true },
    },
  };
}

// ---------------------------------------------------------------------------
// Saved items
// ---------------------------------------------------------------------------

export type SavedKind = 'venue' | 'spot';

export interface SavedItem {
  readonly personId: PersonId;
  readonly kind: SavedKind;
  readonly refId: VenueId | SpotId;
  readonly savedAt: Timestamp;
}

const sameItem = (a: SavedItem, kind: SavedKind, refId: VenueId | SpotId): boolean =>
  a.kind === kind && (a.refId as string) === (refId as string);

export function isSaved(
  saved: readonly SavedItem[],
  personId: PersonId,
  kind: SavedKind,
  refId: VenueId | SpotId,
): boolean {
  return saved.some((s) => s.personId === personId && sameItem(s, kind, refId));
}

/** Idempotent — saving twice is one save, not two. */
export function saveItem(
  saved: readonly SavedItem[],
  personId: PersonId,
  kind: SavedKind,
  refId: VenueId | SpotId,
  clock: Clock,
): readonly SavedItem[] {
  if (isSaved(saved, personId, kind, refId)) return saved;
  return [...saved, { personId, kind, refId, savedAt: clock.now() }];
}

export function unsaveItem(
  saved: readonly SavedItem[],
  personId: PersonId,
  kind: SavedKind,
  refId: VenueId | SpotId,
): readonly SavedItem[] {
  return saved.filter((s) => !(s.personId === personId && sameItem(s, kind, refId)));
}

export function savedFor(
  saved: readonly SavedItem[],
  personId: PersonId,
): readonly SavedItem[] {
  return saved.filter((s) => s.personId === personId).sort((a, b) => b.savedAt - a.savedAt);
}

// ---------------------------------------------------------------------------
// Interest
// ---------------------------------------------------------------------------

export interface Interest {
  readonly fromId: PersonId;
  readonly toId: PersonId;
  readonly at: Timestamp;
}

/**
 * Express interest in someone.
 *
 * Seeing who has expressed interest in *you* is a premium feature, so this
 * records a real signal rather than firing a toast at nothing. Self-interest
 * is dropped — it would inflate the very count premium sells.
 */
export function expressInterest(
  interest: readonly Interest[],
  fromId: PersonId,
  toId: PersonId,
  clock: Clock,
): readonly Interest[] {
  if (fromId === toId) return interest;
  if (interest.some((i) => i.fromId === fromId && i.toId === toId)) return interest;
  return [...interest, { fromId, toId, at: clock.now() }];
}

export function interestReceived(
  interest: readonly Interest[],
  personId: PersonId,
): readonly Interest[] {
  return interest.filter((i) => i.toId === personId).sort((a, b) => b.at - a.at);
}

/** Both expressed interest in each other, independently. */
export function isMutualInterest(
  interest: readonly Interest[],
  a: PersonId,
  b: PersonId,
): boolean {
  const one = interest.some((i) => i.fromId === a && i.toId === b);
  const other = interest.some((i) => i.fromId === b && i.toId === a);
  return one && other;
}
