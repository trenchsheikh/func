import type { InviteCardView } from '@/data/views';
import { distanceKm } from '@/domain/geo';
import { isHappeningNow } from '@/domain/pool';
import type { LatLng, Venue, VenueCategory } from '@/domain/types';
import { categoryLabel } from '../theme';

export type Item =
  | { type: 'header'; key: string; label: string }
  | { type: 'invite'; key: string; invite: InviteCardView }
  | { type: 'venue'; key: string; venue: Venue }
  | { type: 'area'; key: string; area: string; center: LatLng; count: number };

/**
 * Temporary curated-shelf cap for "Near You" — chief-of-staff decision
 * 2026-08-23: not real behavioral ranking, just keeps the shelf scannable
 * until real usage data justifies a "For You" system. Named and tunable
 * rather than a magic number so it's easy to find and revisit.
 */
const NEAR_YOU_CAP = 6;

/** An invite's disclosed coordinate, or null when the viewer isn't shown one. */
function inviteLocation(invite: InviteCardView): LatLng | null {
  return invite.where.kind === 'exact' ? invite.where.location : null;
}

/** Distance-from-viewer comparator. Invites without a disclosed location sort after ones that have it, never crash. */
function byInviteDistance(viewerLocation: LatLng | null) {
  return (a: InviteCardView, b: InviteCardView): number => {
    if (!viewerLocation) return 0;
    const la = inviteLocation(a);
    const lb = inviteLocation(b);
    if (!la && !lb) return 0;
    if (!la) return 1;
    if (!lb) return -1;
    return distanceKm(viewerLocation, la) - distanceKm(viewerLocation, lb);
  };
}

/**
 * The default (no-query) Browse rows: Live Near You (invites reading as
 * happening now, nearest first), Near You (the remaining, not-yet-started
 * invites, nearest first, capped at `NEAR_YOU_CAP` — chief-of-staff
 * decision 2026-08-23: nothing gets hidden from the default view; venues
 * stay represented via the genre rows below rather than their own "near"
 * shelf), then a genre row per venue category. Pure and testable — takes
 * plain arrays and the viewer's own location, never a `Snapshot` or another
 * user's presence. `viewerLocation: null` (no fix yet) degrades every
 * distance sort to a stable no-op rather than guessing a location.
 *
 * Invites are the privacy-projected `InviteCardView` (never a raw
 * `PoolInvite`) — only what `viewFor` already disclosed to this viewer.
 *
 * Kept in its own React-free module (unlike `Discover.tsx`) so it can be
 * unit-tested directly with `node:test` — importing anything that pulls in
 * `react-native` fails that runner outside Metro's transformer.
 */
export function browseSections(
  invites: readonly InviteCardView[],
  venues: readonly Venue[],
  viewerLocation: LatLng | null,
  now: Date,
): Item[] {
  const mapVenues = venues.filter((v) => v.category !== 'shop');
  const byDistance = byInviteDistance(viewerLocation);

  const liveNearYou = [...invites].filter((i) => isHappeningNow(i, now)).sort(byDistance);
  const nearYou = [...invites]
    .filter((i) => !isHappeningNow(i, now))
    .sort(byDistance)
    .slice(0, NEAR_YOU_CAP);

  const byCategory = new Map<VenueCategory, Venue[]>();
  for (const v of mapVenues) byCategory.set(v.category, [...(byCategory.get(v.category) ?? []), v]);

  const out: Item[] = [];
  if (liveNearYou.length) {
    out.push({ type: 'header', key: 'h-live', label: 'Live Near You' });
    out.push(...liveNearYou.map<Item>((invite) => ({ type: 'invite', key: `live-${invite.id}`, invite })));
  }
  if (nearYou.length) {
    out.push({ type: 'header', key: 'h-near-you', label: 'Near You' });
    out.push(...nearYou.map<Item>((invite) => ({ type: 'invite', key: `near-${invite.id}`, invite })));
  }
  for (const [cat, catVenues] of byCategory) {
    out.push({ type: 'header', key: `h-genre-${cat}`, label: `${categoryLabel(cat)}s` });
    out.push(...catVenues.map<Item>((venue) => ({ type: 'venue', key: `genre-${cat}-${venue.id}`, venue })));
  }
  return out;
}
