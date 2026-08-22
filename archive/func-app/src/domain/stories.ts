/**
 * Stories, and the check-in that makes one verified.
 *
 * A story posted from inside a venue carries a verified mark; one posted from
 * anywhere else does not. That mark is the whole value of the feature — it is
 * what makes the map's "live from inside" claim true — so the check is made
 * against a real geofence at post time, never against intent.
 *
 * Under the new product model, check-in has a **narrower** job than it had in
 * the prototype. It is no longer a source of presence — presence comes from
 * real location plus DTF. Check-in survives only as proof that you were
 * genuinely at a place when you posted.
 */

import type { Clock, Timestamp } from './clock';
import { isWithin, type Coordinates } from './geography';
import type { PersonId, StoryId, VenueId } from './ids';

/** How long a check-in vouches for you being somewhere. */
export const CHECKIN_TTL_MS = 3 * 60 * 60 * 1000;

/** Stories leave the map after this. A story that never expires is a post. */
export const STORY_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Geofence radius for "inside" a venue.
 *
 * Judgment call, flagged rather than buried: 75m is generous enough to cover a
 * warehouse venue and a queue outside the door, tight enough that the bar
 * across the street does not count. Wants tuning against real venues.
 */
export const VENUE_GEOFENCE_METRES = 75;

export interface CheckIn {
  readonly personId: PersonId;
  readonly venueId: VenueId;
  readonly at: Timestamp;
  readonly expiresAt: Timestamp;
}

export interface Story {
  readonly id: StoryId;
  readonly by: PersonId;
  readonly venueId: VenueId | null;
  readonly postedAt: Timestamp;
  /** True only if the poster was genuinely inside the venue at post time. */
  readonly verifiedAtVenue: boolean;
  readonly gradient: readonly [string, string];
}

// ---------------------------------------------------------------------------
// Check-in
// ---------------------------------------------------------------------------

export type CheckInError = 'too_far';

export function checkIn(
  personId: PersonId,
  venue: { id: VenueId; at: Coordinates },
  deviceAt: Coordinates | null,
  clock: Clock,
):
  | { readonly ok: true; readonly value: CheckIn }
  | { readonly ok: false; readonly error: CheckInError } {
  // No fix, or a fix outside the fence, means no check-in. The prototype let
  // "I'm going" stand in for arriving, which made the verified mark a promise
  // rather than a fact.
  if (!deviceAt || !isWithin(venue.at, deviceAt, VENUE_GEOFENCE_METRES)) {
    return { ok: false, error: 'too_far' };
  }
  const now = clock.now();
  return {
    ok: true,
    value: { personId, venueId: venue.id, at: now, expiresAt: now + CHECKIN_TTL_MS },
  };
}

/** The person's live check-in, or null. Most recent wins. */
export function activeCheckIn(
  checkIns: readonly CheckIn[],
  personId: PersonId,
  now: Timestamp,
): CheckIn | null {
  const live = checkIns
    .filter((c) => c.personId === personId && c.expiresAt > now)
    .sort((a, b) => b.at - a.at);
  return live[0] ?? null;
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export interface PostStoryInput {
  readonly id: StoryId;
  readonly by: PersonId;
  readonly gradient: readonly [string, string];
  /** The poster's live check-in at post time, if any. */
  readonly checkIn: CheckIn | null;
}

/**
 * Post a story.
 *
 * The verified mark is decided here, from the check-in supplied at the moment
 * of posting — re-read by the caller immediately before calling, never cached
 * from when a composer was opened. A composer can sit open long enough for a
 * check-in to lapse, and the prototype shipped a bug where exactly that
 * produced a venue-less, unreachable story while the button reported success.
 *
 * The check-in must also actually belong to the poster. Today's only caller
 * already filters to the poster's own check-ins before this is reached, but
 * this function is the one place that decides the verified mark, so it must
 * not trust a mismatched check-in handed to it by some future caller.
 */
export function postStory(input: PostStoryInput, clock: Clock): Story {
  const now = clock.now();
  const ownCheckIn = input.checkIn && input.checkIn.personId === input.by ? input.checkIn : null;
  const live = ownCheckIn && ownCheckIn.expiresAt > now ? ownCheckIn : null;
  return {
    id: input.id,
    by: input.by,
    venueId: live ? live.venueId : null,
    postedAt: now,
    verifiedAtVenue: live !== null,
    gradient: input.gradient,
  };
}

export function isExpired(story: Story, now: Timestamp): boolean {
  return now - story.postedAt >= STORY_TTL_MS;
}

export function liveStories(
  stories: readonly Story[],
  now: Timestamp,
): readonly Story[] {
  return stories.filter((s) => !isExpired(s, now));
}

export function storiesAtVenue(
  stories: readonly Story[],
  venueId: VenueId,
  now: Timestamp,
): readonly Story[] {
  return liveStories(stories, now)
    .filter((s) => s.venueId === venueId)
    .sort((a, b) => b.postedAt - a.postedAt);
}

/** Age in whole minutes — what the story ring renders. */
export function ageMinutes(story: Story, now: Timestamp): number {
  return Math.max(0, Math.round((now - story.postedAt) / 60_000));
}
