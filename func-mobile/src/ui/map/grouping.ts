import type { LatLng } from '@/domain/types';
import type { MapPin } from './content';
import { categoryLabel, statusLabel } from '../theme';

/**
 * Degrees of lat/lng within which same-kind pins merge into one group, at a
 * given zoom. Halves per zoom level so clustering loosens continuously from
 * globe to street. Deliberately a simple function of zoom only — not real
 * Web Mercator pixel math — matching this map's existing pin-placement
 * precision (see `content.ts`/`Pins.tsx`, none of which reason in pixels
 * either).
 */
const BASE_RADIUS_DEG = 8;

export function clusterRadiusDegrees(zoom: number): number {
  return BASE_RADIUS_DEG / Math.pow(2, zoom);
}

export type MapGroup =
  | { kind: 'venue'; id: string; location: LatLng; pins: Array<Extract<MapPin, { kind: 'venue' }>> }
  | { kind: 'invite'; id: string; location: LatLng; pins: Array<Extract<MapPin, { kind: 'invite' }>> }
  | { kind: 'person'; id: string; location: LatLng; pins: Array<Extract<MapPin, { kind: 'person' }>> }
  | { kind: 'business'; id: string; location: LatLng; pins: Array<Extract<MapPin, { kind: 'business' }>> };

function distanceDegrees(a: LatLng, b: LatLng): number {
  return Math.hypot(a.lat - b.lat, a.lng - b.lng);
}

function centroidOf(points: readonly LatLng[]): LatLng {
  const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  return { lat, lng };
}

function clusterByProximity<T extends { location: LatLng }>(
  items: readonly T[],
  radius: number,
): Array<{ items: T[]; centroid: LatLng }> {
  const clusters: Array<{ items: T[]; centroid: LatLng }> = [];
  for (const item of items) {
    const near = clusters.find((c) => distanceDegrees(c.centroid, item.location) <= radius);
    if (near) {
      near.items.push(item);
      near.centroid = centroidOf(near.items.map((i) => i.location));
    } else {
      clusters.push({ items: [item], centroid: item.location });
    }
  }
  return clusters;
}

/**
 * Clusters one already-filtered, homogeneous bucket of same-kind pins into
 * `MapGroup`s. `K` is inferred from the literal `kind` argument at each call
 * site (see `groupPins` below), so callers get full type safety; only this
 * one small generic body needs the cast, justified by construction —
 * `bucket`'s element type is always `Extract<MapPin, { kind: K }>` because
 * every call site filters with that exact literal first.
 */
function groupBucket<K extends MapGroup['kind']>(
  kind: K,
  bucket: readonly Extract<MapPin, { kind: K }>[],
  radius: number,
): MapGroup[] {
  const out: MapGroup[] = [];
  for (const c of clusterByProximity(bucket, radius)) {
    const first = c.items[0];
    if (!first) continue; // clusterByProximity never emits an empty cluster; guard only satisfies noUncheckedIndexedAccess.
    out.push({
      kind,
      id: c.items.length === 1 ? first.id : `cluster:${kind}:${c.items.map((p) => p.id).sort().join('+')}`,
      location: c.centroid,
      pins: c.items,
    } as MapGroup);
  }
  return out;
}

/**
 * Groups same-kind pins that fall within the zoom-scaled radius of each
 * other's running centroid. Kinds are never mixed — every group's `pins`
 * are all the same `kind` as the group itself, so a `person` pin (an
 * eligible self/friend) and a `business` pin (a verified business acting
 * account) can never share a group — they render as completely different
 * single-pin treatments — and venues never share a group with invites.
 *
 * Deterministic: pins are processed in a stable order (sorted by id) so the
 * result does not depend on the order pins were passed in.
 *
 * Input must already be `mapPins()`'s output — the privacy-redacted
 * projection. This function never reads `ViewerSnapshot.presence` or any raw
 * `FuncUser`/`PersonDisclosure` data directly; it only reshapes the
 * `MapPin[]` it's given.
 */
export function groupPins(pins: readonly MapPin[], zoom: number): MapGroup[] {
  const radius = clusterRadiusDegrees(zoom);
  const sorted = [...pins].sort((a, b) => a.id.localeCompare(b.id));

  const venues = sorted.filter((p): p is Extract<MapPin, { kind: 'venue' }> => p.kind === 'venue');
  const invites = sorted.filter((p): p is Extract<MapPin, { kind: 'invite' }> => p.kind === 'invite');
  const people = sorted.filter((p): p is Extract<MapPin, { kind: 'person' }> => p.kind === 'person');
  const businesses = sorted.filter((p): p is Extract<MapPin, { kind: 'business' }> => p.kind === 'business');

  return [
    ...groupBucket('venue', venues, radius),
    ...groupBucket('invite', invites, radius),
    ...groupBucket('person', people, radius),
    ...groupBucket('business', businesses, radius),
  ];
}

/**
 * Privacy-safe spoken label for a marker or cluster — never says more than
 * the visual already discloses. A single `person` pin only ever exists here
 * for `self` or an eligible friend (`personDisclosure` already gated that
 * before this pin existed at all), so naming them is not a new disclosure.
 * A `business` pin names only the venue it resolved to, never the operator's
 * personal identity behind it.
 */
export function accessibilityLabelForGroup(group: MapGroup): string {
  const [pin] = group.pins;
  if (group.pins.length === 1 && pin) {
    if (pin.kind === 'venue') return `${pin.venue.name}, ${categoryLabel(pin.venue.category)}`;
    if (pin.kind === 'invite') return pin.invite.description;
    if (pin.kind === 'business') return `${pin.venue.name}, business`;
    return `${pin.person.displayName}, ${statusLabel(pin.disclosure.status)}`;
  }
  if (group.kind === 'venue') return `${group.pins.length} places nearby`;
  if (group.kind === 'invite') return `${group.pins.length} invites nearby`;
  if (group.kind === 'business') return `${group.pins.length} businesses nearby`;
  return `${group.pins.length} friends nearby`;
}
