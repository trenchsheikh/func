/**
 * Geography — world-scale by construction.
 *
 * The prototype baked San Francisco into the architecture: a 457KB geometry
 * file, a map projection derived at load time from one fixed bounding box, and
 * a hardcoded "you are here" coordinate used by every distance calculation.
 * Adding a second city meant rewriting the map.
 *
 * The rule this file exists to enforce:
 *
 *   **No city may be named anywhere in the domain layer.**
 *
 * San Francisco is seed data. It is loaded through the same interfaces any
 * other city would be, and deleting it must leave a working product.
 *
 * The second rule, which is what actually makes it scale: the app never asks
 * "what is in this city?" It asks "what is in these bounds?" A viewport query
 * is answerable at any zoom, anywhere on Earth, without the caller knowing
 * which city — or how many cities — the viewport happens to straddle.
 */

import type { CityId, CountryId, DistrictId, RegionId, VenueId } from './ids';

/** WGS84. Latitude and longitude in degrees. */
export interface Coordinates {
  readonly lat: number;
  readonly lon: number;
}

/** A map viewport, or any rectangular query region. */
export interface Bounds {
  readonly south: number;
  readonly west: number;
  readonly north: number;
  readonly east: number;
}

/**
 * World → Country → Region → City → District → Venue.
 *
 * Every level is optional to resolve. A venue knows its coordinates always, and
 * its administrative parents only if the data source supplied them — a product
 * that refuses to show a bar because nobody has classified its district is
 * worse than one that shows it with a thin label.
 */
export interface Country {
  readonly id: CountryId;
  readonly name: string;
  /** ISO 3166-1 alpha-2. */
  readonly code: string;
}

export interface Region {
  readonly id: RegionId;
  readonly countryId: CountryId;
  readonly name: string;
}

export interface City {
  readonly id: CityId;
  readonly regionId: RegionId;
  readonly name: string;
  readonly centre: Coordinates;
  readonly bounds: Bounds;
  /** IANA zone — DTF expires at local noon, so cities carry their own clock. */
  readonly timeZone: string;
  /** ISO 4217, e.g. 'USD'. Prices are per-city, not per-product. */
  readonly currency: string;
  readonly status: CityStatus;
}

/**
 * Whether func is actually usable somewhere.
 *
 * The prototype's globe screen distinguished "live" from "waitlist" but then
 * had to special-case a third state in a comment — a city marked live that had
 * no map data yet. Make it explicit instead of a bug waiting to happen.
 */
export type CityStatus =
  | 'live' // venues mapped, product usable
  | 'mapped' // geography exists, not yet open to users
  | 'waitlist'; // announced only

export interface District {
  readonly id: DistrictId;
  readonly cityId: CityId;
  readonly name: string;
}

export type VenueKind = 'dinner' | 'bar' | 'club';

export interface Venue {
  readonly id: VenueId;
  readonly name: string;
  readonly kind: VenueKind;
  readonly at: Coordinates;
  /** Resolved lazily; a venue is valid without one. */
  readonly districtId: DistrictId | null;
  readonly cityId: CityId;
  readonly vibe: readonly string[];
  /** Entry price range in minor units (cents), inclusive. */
  readonly entry: PriceRange;
  /** Typical spend for a night, in minor units. */
  readonly spend: PriceRange;
  readonly blurb: string;
  readonly verified: boolean;
}

/**
 * Money in minor units, always.
 *
 * The prototype stored per-head as a float and floored it to the dollar,
 * silently turning $24.50 into $24. Integer minor units make that class of bug
 * unrepresentable.
 */
export interface Money {
  readonly amount: number; // minor units, e.g. cents
  readonly currency: string; // ISO 4217
}

export interface PriceRange {
  readonly min: Money;
  readonly max: Money;
}

export const money = (amount: number, currency: string): Money => ({
  amount: Math.round(amount),
  currency,
});

/** Parse a user-entered major-unit amount ("24.50") into minor units. */
export function moneyFromMajorUnits(value: number, currency: string): Money {
  if (!Number.isFinite(value) || value < 0) return money(0, currency);
  return money(Math.round(value * 100), currency);
}

// ---------------------------------------------------------------------------
// Spatial helpers
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6_371_008.8;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Great-circle distance in metres. Metric in the domain; format at the edge. */
export function distanceMetres(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function containsPoint(bounds: Bounds, point: Coordinates): boolean {
  if (point.lat < bounds.south || point.lat > bounds.north) return false;
  // Bounds crossing the antimeridian have west > east.
  return bounds.west <= bounds.east
    ? point.lon >= bounds.west && point.lon <= bounds.east
    : point.lon >= bounds.west || point.lon <= bounds.east;
}

/**
 * Is `point` within `radiusMetres` of `centre`?
 *
 * Used for venue geofencing — the check behind a story's verified mark.
 */
export function isWithin(
  centre: Coordinates,
  point: Coordinates,
  radiusMetres: number,
): boolean {
  return distanceMetres(centre, point) <= radiusMetres;
}

// ---------------------------------------------------------------------------
// Repository interfaces — the seam that keeps the product city-agnostic
// ---------------------------------------------------------------------------

/**
 * Everything the map needs, expressed as viewport queries.
 *
 * Note what is absent: there is no `getVenuesForCity()`. Offering one would
 * invite screens to enumerate a city, which is the habit that made the
 * prototype impossible to extend past San Francisco.
 */
export interface PlaceRepository {
  venuesWithin(bounds: Bounds, limit?: number): Promise<readonly Venue[]>;
  venueById(id: VenueId): Promise<Venue | null>;
  /** Which city, if any, contains this point. Null over open ocean. */
  cityAt(point: Coordinates): Promise<City | null>;
  citiesWithin(bounds: Bounds): Promise<readonly City[]>;
  districtAt(point: Coordinates): Promise<District | null>;
}
