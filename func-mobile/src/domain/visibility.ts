import { isPresenceLive } from './liveStatus';
import type { FuncUser, LatLng, LiveStatus, PersonalProfile, Venue } from './types';

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

/** lastKnownLocation present, lat/lng finite and within +-90/+-180, timestamp parses and is <= now. */
export function validFix(p: PersonalProfile, now: Date): LatLng | null {
  const fix = p.lastKnownLocation;
  if (!fix) return null;
  if (!Number.isFinite(fix.lat) || Math.abs(fix.lat) > 90) return null;
  if (!Number.isFinite(fix.lng) || Math.abs(fix.lng) > 180) return null;
  const ts = new Date(fix.timestamp);
  if (Number.isNaN(ts.getTime()) || ts.getTime() > now.getTime()) return null;
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
