/**
 * An in-memory `PlaceRepository`.
 *
 * Answers viewport queries over whatever cities it was handed. The seed data
 * happens to be San Francisco, but nothing here knows that — swap the
 * constructor argument and the same code serves Berlin, or both at once.
 *
 * This is the seam a real place service eventually slots into. When it does,
 * nothing above this file changes.
 */

import {
  containsPoint,
  distanceMetres,
  type Bounds,
  type City,
  type Coordinates,
  type District,
  type PlaceRepository,
  type Venue,
} from '../domain';
import type { VenueId } from '../domain/ids';

export interface PlaceData {
  readonly cities: readonly City[];
  readonly districts: readonly District[];
  readonly venues: readonly Venue[];
}

export class InMemoryPlaceRepository implements PlaceRepository {
  private readonly venuesById: Map<string, Venue>;

  constructor(private readonly data: PlaceData) {
    this.venuesById = new Map(data.venues.map((v) => [v.id as string, v]));
  }

  async venuesWithin(bounds: Bounds, limit?: number): Promise<readonly Venue[]> {
    const hits = this.data.venues.filter((v) => containsPoint(bounds, v.at));
    return limit === undefined ? hits : hits.slice(0, limit);
  }

  async venueById(id: VenueId): Promise<Venue | null> {
    return this.venuesById.get(id as string) ?? null;
  }

  async cityAt(point: Coordinates): Promise<City | null> {
    // Bounding boxes can overlap — a metro area inside a wider region. The
    // tightest containing box wins, which is the one a person would name.
    const containing = this.data.cities.filter((c) => containsPoint(c.bounds, point));
    if (!containing.length) return null;
    return containing.reduce((best, c) => (boxArea(c.bounds) < boxArea(best.bounds) ? c : best));
  }

  async citiesWithin(bounds: Bounds): Promise<readonly City[]> {
    return this.data.cities.filter((c) => containsPoint(bounds, c.centre));
  }

  async districtAt(point: Coordinates): Promise<District | null> {
    // Districts carry no geometry in the seed, so resolve via the nearest
    // venue that has one. Crude, and honest about it: a real implementation
    // uses polygons. It is good enough to label a dropped spot.
    let best: { district: District; metres: number } | null = null;
    for (const venue of this.data.venues) {
      if (!venue.districtId) continue;
      const district = this.data.districts.find((x) => x.id === venue.districtId);
      if (!district) continue;
      const metres = distanceMetres(point, venue.at);
      if (!best || metres < best.metres) best = { district, metres };
    }
    // Beyond a kilometre, "nearest venue" stops being evidence of anything.
    return best && best.metres <= 1000 ? best.district : null;
  }

  /** Synchronous lookups for render paths that cannot await. */
  venueByIdSync(id: VenueId): Venue | null {
    return this.venuesById.get(id as string) ?? null;
  }

  allVenues(): readonly Venue[] {
    return this.data.venues;
  }

  cityById(id: string): City | null {
    return this.data.cities.find((c) => (c.id as string) === id) ?? null;
  }

  districtById(id: string): District | null {
    return this.data.districts.find((x) => (x.id as string) === id) ?? null;
  }
}

const boxArea = (b: Bounds): number =>
  Math.abs(b.north - b.south) * Math.abs(b.east - b.west);
