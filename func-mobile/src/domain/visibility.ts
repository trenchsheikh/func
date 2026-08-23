import { isPresenceLive, parseIso } from './liveStatus';
import type { FuncUser, LatLng, LiveStatus, PersonalProfile, PoolInvite, Venue } from './types';

export type Relationship = 'self' | 'friend' | 'mutual' | 'none' | 'unknown';

export interface ViewerContext {
  readonly viewerUserId: string;
  readonly viewerGroupId: string;
  readonly now: Date;
  readonly relationshipTo: (subjectUserId: string) => Relationship;
  /** Names the simulation boundary. 'simulated' = seeded graph and seeded verification. */
  readonly authority: 'simulated' | 'server';
}

export const QUALIFYING_STATUS = 'dtf' as const;
export const VENUE_RADIUS_M = 100;
export const MIN_MUTUALS_FOR_GLOW = 2;
export const AREA_RADIUS_M = 1500;

/** A peer's presence as the viewer may see it. Only 'self', 'exact' and 'business' carry a coordinate. */
export type PersonDisclosure =
  | { kind: 'self'; location: LatLng; status: LiveStatus; premium: boolean }
  | { kind: 'exact'; userId: string; location: LatLng; status: typeof QUALIFYING_STATUS; premium: boolean }
  | { kind: 'business'; userId: string; venueId: string; location: LatLng }
  | { kind: 'none' };

/**
 * lastKnownLocation present, lat/lng finite and within +-90/+-180, timestamp
 * strictly parses, and since <= fixTimestamp <= now -- a fix from before the
 * current presence session (i.e. predating `liveStatusSince`) is stale and
 * must not be disclosed, even though presence itself is still live.
 */
export function validFix(p: PersonalProfile, now: Date): LatLng | null {
  const fix = p.lastKnownLocation;
  if (!fix) return null;
  if (!Number.isFinite(fix.lat) || Math.abs(fix.lat) > 90) return null;
  if (!Number.isFinite(fix.lng) || Math.abs(fix.lng) > 180) return null;
  const ts = parseIso(fix.timestamp);
  if (!ts) return null;
  const since = parseIso(p.liveStatusSince);
  if (!since) return null;
  if (ts.getTime() < since.getTime() || ts.getTime() > now.getTime()) return null;
  return { lat: fix.lat, lng: fix.lng };
}

export function isVerifiedBusiness(user: FuncUser): boolean {
  return user.activeProfile === 'business' && user.businessProfile?.verification.status === 'verified';
}

/**
 * The only policy function that converts a raw user into a viewer-safe map
 * disclosure. Identity fields never cross this boundary. Rules in order,
 * first match wins.
 */
export function personDisclosure(viewer: ViewerContext, subject: FuncUser, venues: readonly Venue[]): PersonDisclosure {
  // 1. Self.
  if (subject.id === viewer.viewerUserId) {
    if (subject.activeProfile !== 'personal') return { kind: 'none' };
    const fix = validFix(subject.personalProfile, viewer.now);
    if (!isPresenceLive(subject.personalProfile, viewer.now) || !fix) return { kind: 'none' };
    return { kind: 'self', location: fix, status: subject.personalProfile.liveStatus, premium: subject.personalProfile.premium };
  }
  // 2. Business.
  if (subject.activeProfile === 'business') {
    if (!isVerifiedBusiness(subject) || !subject.businessProfile) return { kind: 'none' };
    const venue = venues.find((v) => v.name === subject.businessProfile!.venueName);
    if (!venue) return { kind: 'none' };
    return { kind: 'business', userId: subject.id, venueId: venue.id, location: venue.location };
  }
  // 3. Friend, DTF only.
  const relationship = viewer.relationshipTo(subject.id);
  if (relationship === 'friend') {
    const p = subject.personalProfile;
    const fix = validFix(p, viewer.now);
    if (isPresenceLive(p, viewer.now) && p.liveStatus === QUALIFYING_STATUS && fix) {
      return { kind: 'exact', userId: subject.id, location: fix, status: QUALIFYING_STATUS, premium: p.premium };
    }
    return { kind: 'none' };
  }
  // 4. self (inconsistent graph), mutual, none, unknown -- all none.
  return { kind: 'none' };
}

function distanceMetres(a: LatLng, b: LatLng): number {
  const earthRadius = 6_371_000;
  const latA = (a.lat * Math.PI) / 180;
  const latB = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(latA) * Math.cos(latB) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

/** Venues that glow for this viewer. A set of ids -- no count, no members, ever. */
export function venueGlow(viewer: ViewerContext, users: readonly FuncUser[], venues: readonly Venue[]): ReadonlySet<string> {
  const glowing = new Set<string>();
  for (const venue of venues) {
    if (venue.category === 'shop') continue;
    let qualifying = 0;
    for (const subject of users) {
      if (viewer.relationshipTo(subject.id) !== 'mutual' || subject.activeProfile !== 'personal') continue;
      const p = subject.personalProfile;
      const fix = validFix(p, viewer.now);
      if (!isPresenceLive(p, viewer.now) || p.liveStatus !== QUALIFYING_STATUS || !fix) continue;
      if (distanceMetres(fix, venue.location) <= VENUE_RADIUS_M) qualifying += 1;
      if (qualifying >= MIN_MUTUALS_FOR_GLOW) {
        glowing.add(venue.id);
        break;
      }
    }
  }
  return glowing;
}

export type ViewerInviteRelation = 'host' | 'attending' | 'requested' | 'denied' | 'none';

/** An invite's location as the viewer may see it. Only 'exact' carries a coordinate. */
export type InviteLocationDisclosure =
  | { kind: 'exact'; location: LatLng; venueId?: string }
  | { kind: 'area'; areaLabel: string }
  | { kind: 'hidden' };

function validLocation(loc: LatLng | undefined): LatLng | null {
  if (!loc) return null;
  if (!Number.isFinite(loc.lat) || Math.abs(loc.lat) > 90) return null;
  if (!Number.isFinite(loc.lng) || Math.abs(loc.lng) > 180) return null;
  return loc;
}

/** Nearest venue's area label within AREA_RADIUS_M, or 'Nearby' if none qualify. */
export function areaLabelFor(point: LatLng, venues: readonly Venue[]): string {
  let nearest: { area: string; distance: number } | null = null;
  for (const v of venues) {
    const d = distanceMetres(point, v.location);
    if (d <= AREA_RADIUS_M && (!nearest || d < nearest.distance)) nearest = { area: v.area, distance: d };
  }
  return nearest?.area ?? 'Nearby';
}

/**
 * An invite's location as the viewer may disclose it. Venue-anchored invites
 * (D4) resolve to the venue's coordinate for everyone. Un-anchored public
 * invites are hidden (D5) rather than leaking a private coordinate. Private
 * invites disclose the exact stored coordinate only to the host/attendees;
 * everyone else gets an area label, never a coordinate. `relation` is
 * supplied by the caller (see `pool.ts`'s `relationTo`) rather than
 * recomputed here, so this stays the single source of truth for that logic.
 */
export function inviteDisclosure(
  viewer: ViewerContext,
  invite: PoolInvite,
  host: FuncUser | undefined,
  venues: readonly Venue[],
  relation: ViewerInviteRelation,
): InviteLocationDisclosure {
  const loc = validLocation(invite.location);
  if (!loc) return { kind: 'hidden' };
  if (invite.createdByAccountType === 'business' && !(host && isVerifiedBusiness(host))) return { kind: 'hidden' };
  if (invite.venueId) {
    const venue = venues.find((v) => v.id === invite.venueId);
    if (!venue) return { kind: 'hidden' };
    return { kind: 'exact', location: venue.location, venueId: venue.id };
  }
  if (invite.access.mode === 'public') return { kind: 'hidden' };
  if (relation === 'host' || relation === 'attending') return { kind: 'exact', location: loc };
  return { kind: 'area', areaLabel: areaLabelFor(loc, venues) };
}
