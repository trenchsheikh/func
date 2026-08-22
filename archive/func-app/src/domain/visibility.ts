/**
 * Visibility — who may see where you are, and how precisely.
 *
 * This is the highest-consequence logic in func. Everything else that goes
 * wrong produces a broken screen; a mistake here puts a real person's location
 * in front of someone they did not choose. It lives in one file, it is pure,
 * and it is the only thing permitted to make this decision. No screen, no
 * query, no cache may re-derive it.
 *
 * The rules, exactly as Phoenix specified them:
 *
 *   Friend    — sees your location when **your DTF is on**.
 *   Mutual    — sees you when **both** of you have the mutuals setting on
 *               **and both** of you are DTF.
 *   Anyone else — never. They contribute to anonymous heat and nothing more.
 *
 * And the intimacy gradient on top:
 *
 *   Friend  → exact position.
 *   Mutual  → presence only. "People you know are here", never who or exactly
 *             where. A venue view must not become a surveillance map.
 *
 * The gradient is enforced by the type system rather than by discipline: the
 * `aggregate` result carries no coordinates at all, so a screen cannot render a
 * mutual's exact position even by mistake. You cannot leak what you were never
 * handed.
 */

import type { Timestamp } from './clock';
import type { Coordinates } from './geography';
import type { PersonId, VenueId } from './ids';
import {
  isDtf,
  isFresh,
  type LocationFix,
  type PresenceProfile,
} from './presence';

// ---------------------------------------------------------------------------
// The social graph
// ---------------------------------------------------------------------------

/**
 * How two people are related, from the viewer's side.
 *
 * The prototype had no graph at all — `friend: true` and `mutual: 3` were flags
 * stamped on a person record, meaning "friend of the demo user". Nothing was
 * per-viewer, so the concept could not survive a second logged-in account.
 */
export type Relationship = 'self' | 'friend' | 'mutual' | 'none';

export interface SocialGraph {
  /**
   * Friendship is mutual by construction — an accepted request from either
   * side produces the same edge. Implementations must guarantee
   * `relationship(a, b) === relationship(b, a)`.
   */
  relationship(viewer: PersonId, subject: PersonId): Relationship;
  /** Friend ids, used to compute mutual counts. */
  friendsOf(person: PersonId): readonly PersonId[];
}

// ---------------------------------------------------------------------------
// The result types
// ---------------------------------------------------------------------------

/**
 * What a viewer is allowed to know about one person's whereabouts.
 *
 * Note that `aggregate` has no position field. That is the safety property, not
 * an oversight.
 */
export type VisibleLocation =
  | { readonly precision: 'none' }
  | { readonly precision: 'aggregate' }
  | {
      readonly precision: 'exact';
      readonly at: Coordinates;
      readonly recordedAt: Timestamp;
    };

const HIDDEN: VisibleLocation = { precision: 'none' };
const AGGREGATE: VisibleLocation = { precision: 'aggregate' };

/** Everything the rules need about one person, gathered by the caller. */
export interface PersonPresenceSnapshot {
  readonly id: PersonId;
  readonly profile: PresenceProfile;
  /** Most recent device fix, or null if none/permission not granted. */
  readonly fix: LocationFix | null;
}

// ---------------------------------------------------------------------------
// The rule
// ---------------------------------------------------------------------------

/**
 * The single authority on location visibility.
 *
 * Deliberately written so every path that is not an explicit grant falls
 * through to hidden. Adding a relationship type later without updating this
 * function fails closed.
 */
export function visibleLocation(
  viewer: PersonPresenceSnapshot,
  subject: PersonPresenceSnapshot,
  relationship: Relationship,
  now: Timestamp,
): VisibleLocation {
  // You always see yourself, and your own dot should not blink out because you
  // went amber.
  if (relationship === 'self' || viewer.id === subject.id) {
    return subject.fix && isFresh(subject.fix, now)
      ? { precision: 'exact', at: subject.fix.at, recordedAt: subject.fix.recordedAt }
      : HIDDEN;
  }

  if (!permits(viewer, subject, relationship, now)) return HIDDEN;

  // Permission granted — now decide precision.
  if (relationship === 'mutual') return AGGREGATE;

  // Friends get the real thing, if there is a real thing to give. A stale fix
  // is withheld rather than shown as current.
  if (!subject.fix || !isFresh(subject.fix, now)) return HIDDEN;
  return { precision: 'exact', at: subject.fix.at, recordedAt: subject.fix.recordedAt };
}

/**
 * Is any location sharing permitted at all between these two right now?
 *
 * Split out from `visibleLocation` because the answer is needed on its own —
 * for settings screens that explain why someone cannot see you, and for
 * queries that must not even fetch a fix they would not be allowed to use.
 */
export function permits(
  viewer: PersonPresenceSnapshot,
  subject: PersonPresenceSnapshot,
  relationship: Relationship,
  now: Timestamp,
): boolean {
  switch (relationship) {
    case 'self':
      return true;

    // A friend sees you whenever you are DTF. Your setting, your call — it does
    // not depend on what they have switched on.
    case 'friend':
      return isDtf(subject.profile, now);

    // Mutuals need all four conditions. Both people opted in permanently, and
    // both are out tonight.
    case 'mutual':
      return (
        subject.profile.shareWithMutuals &&
        viewer.profile.shareWithMutuals &&
        isDtf(subject.profile, now) &&
        isDtf(viewer.profile, now)
      );

    case 'none':
      return false;

    default: {
      // Exhaustiveness guard: a new relationship type must be handled here
      // explicitly, and until it is, it grants nothing.
      const _never: never = relationship;
      void _never;
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Venue rollup
// ---------------------------------------------------------------------------

/**
 * What a viewer sees about who is at a venue.
 *
 * The prototype rendered friends and mutuals as identical named avatars side by
 * side — verified live at Monarch, where a friend and a mutual were
 * indistinguishable. This is the fix: friends are named, mutuals are counted.
 */
export interface VenuePresenceView {
  readonly venueId: VenueId;
  /** Named, with exact presence established. Safe to show avatars for. */
  readonly friends: readonly PersonId[];
  /**
   * How many mutuals are here. A count only — no ids, no names, no avatars,
   * because the type carries none.
   */
  readonly mutualCount: number;
}

/**
 * Minimum mutuals before the count is shown at all.
 *
 * A venue reporting "1 mutual is here" when only one other person is present
 * identifies them by elimination — the aggregate has to actually aggregate.
 * Below the threshold, mutuals fall back to contributing to anonymous heat.
 *
 * Judgment call, flagged rather than buried: 2 is the smallest number that
 * hides an individual. Raise it if it feels thin in practice.
 */
export const MIN_MUTUALS_TO_DISPLAY = 2;

export function venuePresence(
  viewer: PersonPresenceSnapshot,
  peopleAtVenue: readonly { person: PersonPresenceSnapshot; venueId: VenueId }[],
  venueId: VenueId,
  graph: SocialGraph,
  now: Timestamp,
): VenuePresenceView {
  const friends: PersonId[] = [];
  let mutuals = 0;

  for (const entry of peopleAtVenue) {
    if (entry.venueId !== venueId) continue;
    if (entry.person.id === viewer.id) continue;

    const rel = graph.relationship(viewer.id, entry.person.id);
    const seen = visibleLocation(viewer, entry.person, rel, now);

    if (seen.precision === 'exact') friends.push(entry.person.id);
    else if (
      seen.precision === 'aggregate' &&
      entry.person.fix &&
      isFresh(entry.person.fix, now)
    ) {
      // visibleLocation() deliberately ignores fix freshness for mutuals —
      // "are we allowed to know about each other at all tonight" does not
      // depend on GPS data. But placing someone at *this specific venue*
      // does: that is a claim about where they are right now, and a fix
      // hours old is exactly the "shown as current when it is a lie" case
      // isFresh exists to prevent. A mutual with no fix, or a stale one,
      // contributes to anonymous heat instead — same as a friend would.
      mutuals += 1;
    }
  }

  return {
    venueId,
    friends,
    mutualCount: mutuals >= MIN_MUTUALS_TO_DISPLAY ? mutuals : 0,
  };
}

/**
 * Count of mutual friends between two people — the "3 mutuals" badge.
 *
 * Distinct from location visibility and deliberately not gated by it: knowing
 * how many friends you share with someone reveals nothing about where either
 * of you is.
 */
export function mutualFriendCount(
  a: PersonId,
  b: PersonId,
  graph: SocialGraph,
): number {
  const theirs = new Set(graph.friendsOf(b));
  return graph.friendsOf(a).filter((id) => theirs.has(id)).length;
}
