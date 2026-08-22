import type { Snapshot } from '@/data/repository';
import { groupLead } from '@/data/selectors';
import { livePinFor, type LivePin } from '@/domain/liveStatus';
import type { FuncUser, LatLng, PoolInvite, Venue } from '@/domain/types';

export type MapPin =
  | { kind: 'venue'; id: string; location: LatLng; venue: Venue }
  | { kind: 'invite'; id: string; location: LatLng; invite: PoolInvite; host: FuncUser | undefined }
  | { kind: 'live'; id: string; location: LatLng; live: LivePin; user: FuncUser };

/** Everything the map draws, derived from the snapshot. Shops are excluded entirely. */
export function mapPins(s: Snapshot, now: Date): MapPin[] {
  const venues: MapPin[] = s.venues
    .filter((v) => v.category !== 'shop')
    .map((v) => ({ kind: 'venue', id: `venue:${v.id}`, location: v.location, venue: v }));
  const invites: MapPin[] = s.invites.map((inv) => ({
    kind: 'invite',
    id: `invite:${inv.id}`,
    location: inv.location,
    invite: inv,
    host: groupLead(s, inv.hostGroupId),
  }));
  const live: MapPin[] = s.users.flatMap((u) => {
    const pin = livePinFor(u, s.venues, now);
    return pin ? [{ kind: 'live' as const, id: `live:${u.id}`, location: pin.location, live: pin, user: u }] : [];
  });
  return [...venues, ...invites, ...live];
}
