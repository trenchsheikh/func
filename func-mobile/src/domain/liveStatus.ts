import type { FuncUser, LiveStatus, Venue } from './types';

/** Pins for `off` users are hidden entirely once the last fix is this old. */
export const OFF_PIN_TTL_HOURS = 48;

export function hoursSince(iso: string, now: Date): number {
  return Math.max(0, (now.getTime() - new Date(iso).getTime()) / 3_600_000);
}

/** What the map should draw for a user, or null if nothing. */
export type LivePin =
  | {
      kind: 'personal';
      userId: string;
      status: LiveStatus;
      premium: boolean;
      location: { lat: number; lng: number };
      /** Whole hours since the last known location (meaningful for `off`). */
      elapsedHours: number;
    }
  | {
      kind: 'business';
      userId: string;
      venueName: string;
      location: { lat: number; lng: number };
    };

/**
 * Resolve a user to a map pin.
 *
 * - Business accounts never have live status; they render as a plain silver
 *   disco ball at their venue (resolved by venue name — BusinessProfile's
 *   locked shape carries no coordinates).
 * - Personal accounts need a last known location; `off` pins expire after 48h.
 */
export function livePinFor(
  user: FuncUser,
  venues: readonly Venue[],
  now: Date,
): LivePin | null {
  if (user.activeProfile === 'business') {
    const biz = user.businessProfile;
    if (!biz) return null;
    const venue = venues.find((v) => v.name === biz.venueName);
    if (!venue) return null;
    return {
      kind: 'business',
      userId: user.id,
      venueName: biz.venueName,
      location: venue.location,
    };
  }
  const p = user.personalProfile;
  if (!p.lastKnownLocation) return null;
  const elapsed = hoursSince(p.lastKnownLocation.timestamp, now);
  if (elapsed >= OFF_PIN_TTL_HOURS) return null;
  return {
    kind: 'personal',
    userId: user.id,
    status: p.liveStatus,
    premium: p.premium,
    location: { lat: p.lastKnownLocation.lat, lng: p.lastKnownLocation.lng },
    elapsedHours: Math.floor(elapsed),
  };
}

/** Live status is a personal-profile concept only. */
export function canUseLiveStatus(user: FuncUser): boolean {
  return user.activeProfile === 'personal';
}
