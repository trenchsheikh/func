/**
 * Business operations — claiming a venue and posting tables.
 *
 * Two rules carried over from the prototype, both deliberate:
 *
 *   - A business may run **more than one** venue. Seed data already had one
 *     promoter running two, and the prototype's dashboard hid the claim button
 *     after the first claim, which made the second impossible through the UI.
 *   - Venues are **pre-mapped real places**, not user-created locations. A
 *     business attaches itself to a venue that already exists; it cannot
 *     invent one. That is what stops the map filling with fictional bars.
 */

import type { Money, Venue } from './geography';
import { moneyFromMajorUnits } from './geography';
import type { BusinessId, TableId, VenueId } from './ids';
import type { TableOffer } from './access';

export type BusinessKind = 'promoter' | 'venue_operator';

export interface Business {
  readonly id: BusinessId;
  readonly name: string;
  readonly kind: BusinessKind;
  readonly venueIds: readonly VenueId[];
  readonly verified: boolean;
  readonly bio: string;
}

export type VenueError =
  | 'already_claimed'
  | 'not_verified'
  | 'unknown_venue'
  | 'not_your_venue'
  | 'invalid_seats';

export type VenueResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: VenueError; readonly claimedBy?: string };

/** Which business, if any, already runs this venue. */
export function claimantOf(
  venueId: VenueId,
  businesses: readonly Business[],
): Business | null {
  return businesses.find((b) => b.venueIds.includes(venueId)) ?? null;
}

/** Venues nobody has claimed — what the dashboard offers. */
export function unclaimedVenues(
  venues: readonly Venue[],
  businesses: readonly Business[],
): readonly Venue[] {
  const taken = new Set(businesses.flatMap((b) => b.venueIds));
  return venues.filter((v) => !taken.has(v.id));
}

export function claimVenue(
  business: Business,
  venueId: VenueId,
  allVenues: readonly Venue[],
  allBusinesses: readonly Business[],
): VenueResult<Business> {
  // Idempotent — re-claiming your own venue is a no-op, not an error. A
  // double-tap should not read as a failure.
  if (business.venueIds.includes(venueId)) return { ok: true, value: business };

  if (!business.verified) return { ok: false, error: 'not_verified' };
  if (!allVenues.some((v) => v.id === venueId)) {
    return { ok: false, error: 'unknown_venue' };
  }

  const claimant = claimantOf(venueId, allBusinesses);
  if (claimant) {
    return { ok: false, error: 'already_claimed', claimedBy: claimant.name };
  }

  return { ok: true, value: { ...business, venueIds: [...business.venueIds, venueId] } };
}

export function releaseVenue(business: Business, venueId: VenueId): Business {
  return { ...business, venueIds: business.venueIds.filter((id) => id !== venueId) };
}

export interface PostTableInput {
  readonly id: TableId;
  readonly business: Business;
  readonly venueId: VenueId;
  readonly name: string;
  readonly seats: number;
  /** Major units as typed by the user, e.g. 24.50. */
  readonly perHeadMajorUnits: number;
  readonly currency: string;
  readonly vibe: string;
}

/**
 * Post a table offer.
 *
 * Per-head is converted to integer minor units here, at the boundary, so no
 * float ever reaches the domain. The prototype floored to the dollar and
 * silently turned $24.50 into $24 on a field its own UI labelled "Per head ($)".
 */
export function postTable(input: PostTableInput): VenueResult<TableOffer> {
  if (!input.business.venueIds.includes(input.venueId)) {
    return { ok: false, error: 'not_your_venue' };
  }
  if (!Number.isFinite(input.seats) || input.seats < 1) {
    return { ok: false, error: 'invalid_seats' };
  }

  const perHead: Money = moneyFromMajorUnits(input.perHeadMajorUnits, input.currency);

  return {
    ok: true,
    value: {
      id: input.id,
      venueId: input.venueId,
      businessId: input.business.id,
      name: input.name.trim() || 'Table',
      seats: Math.floor(input.seats),
      perHead,
      vibe: input.vibe.trim(),
    },
  };
}

export function tablesAtVenue(
  tables: readonly TableOffer[],
  venueId: VenueId,
): readonly TableOffer[] {
  return tables.filter((t) => t.venueId === venueId);
}

export function tablesForBusiness(
  tables: readonly TableOffer[],
  businessId: BusinessId,
): readonly TableOffer[] {
  return tables.filter((t) => t.businessId === businessId);
}
