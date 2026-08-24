import type { InviteCardView, PersonSummary, ViewerSnapshot } from '@/data/views';
import type { LatLng, Venue } from '@/domain/types';
import type { PersonDisclosure } from '@/domain/visibility';

export type MapPin =
  | { kind: 'venue'; id: string; location: LatLng; venue: Venue; glow: boolean }
  | { kind: 'invite'; id: string; location: LatLng; invite: InviteCardView }
  | {
      kind: 'person';
      id: string;
      location: LatLng;
      person: PersonSummary;
      disclosure: Extract<PersonDisclosure, { kind: 'self' | 'exact' }>;
    }
  | { kind: 'business'; id: string; location: LatLng; person: PersonSummary; venue: Venue };

/**
 * Everything the map draws, derived from the viewer's already privacy-projected
 * `ViewerSnapshot`. Shops are excluded entirely. This function reads only view
 * data -- no raw `Snapshot` or `LivePin` ever crosses into it -- so it cannot
 * regress past what `viewFor` already disclosed.
 */
export function mapPins(view: ViewerSnapshot): MapPin[] {
  const venues: MapPin[] = view.venues
    .filter((v) => v.category !== 'shop')
    .map((v) => ({
      kind: 'venue',
      id: `venue:${v.id}`,
      location: v.location,
      venue: v,
      glow: view.glowVenueIds.has(v.id),
    }));

  const invites: MapPin[] = view.invites.flatMap((inv) => {
    if (inv.where.kind !== 'exact') return [];
    return [{ kind: 'invite' as const, id: `invite:${inv.id}`, location: inv.where.location, invite: inv }];
  });

  const venueById = new Map(view.venues.map((v) => [v.id, v]));

  const presence: MapPin[] = view.presence.flatMap(({ person, disclosure }): MapPin[] => {
    if (disclosure.kind === 'self' || disclosure.kind === 'exact') {
      return [{ kind: 'person', id: `person:${person.id}`, location: disclosure.location, person, disclosure }];
    }
    // 'business' -- resolve the venue the account is acting as; skip fail-closed if unresolved.
    const venue = venueById.get(disclosure.venueId);
    if (!venue) return [];
    return [{ kind: 'business', id: `business:${person.id}`, location: disclosure.location, person, venue }];
  });

  return [...venues, ...invites, ...presence];
}
