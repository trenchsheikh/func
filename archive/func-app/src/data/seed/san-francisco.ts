/**
 * San Francisco — seed data.
 *
 * This file is the proof that the architecture is not tied to one city. It is
 * data loaded through the same interfaces any other city would use, it names
 * itself only here, and deleting it leaves a working product with an empty map
 * rather than a broken one.
 *
 * Venues, coordinates and districts are real. Everything social is authored for
 * the demo.
 */

import {
  asCityId,
  asCountryId,
  asDistrictId,
  asRegionId,
  asVenueId,
  money,
  type City,
  type Country,
  type District,
  type Region,
  type Venue,
} from '../../domain';
import type { VenueKind } from '../../domain/geography';

export const USA: Country = {
  id: asCountryId('us'),
  name: 'United States',
  code: 'US',
};

export const CALIFORNIA: Region = {
  id: asRegionId('us-ca'),
  countryId: USA.id,
  name: 'California',
};

export const SAN_FRANCISCO: City = {
  id: asCityId('us-ca-sf'),
  regionId: CALIFORNIA.id,
  name: 'San Francisco',
  centre: { lat: 37.7699, lon: -122.4213 },
  bounds: { south: 37.735, west: -122.46, north: 37.81, east: -122.38 },
  timeZone: 'America/Los_Angeles',
  currency: 'USD',
  status: 'live',
};

/**
 * Los Angeles is product-live per the PRD but has no venue data here.
 *
 * Kept because it exercises the `mapped` vs `live` distinction: a city the
 * product has opened but whose map is not built yet is a real state, and the
 * prototype had to special-case it in a comment because its model had no room
 * for it.
 */
export const LOS_ANGELES: City = {
  id: asCityId('us-ca-la'),
  regionId: CALIFORNIA.id,
  name: 'Los Angeles',
  centre: { lat: 34.0522, lon: -118.2437 },
  bounds: { south: 33.9, west: -118.5, north: 34.2, east: -118.1 },
  timeZone: 'America/Los_Angeles',
  currency: 'USD',
  status: 'mapped',
};

const d = (slug: string, name: string): District => ({
  id: asDistrictId(slug),
  cityId: SAN_FRANCISCO.id,
  name,
});

export const SF_DISTRICTS: readonly District[] = [
  d('sf-mission', 'Mission'),
  d('sf-soma', 'SoMa'),
  d('sf-hayes', 'Hayes Valley'),
  d('sf-divis', 'Divisadero'),
  d('sf-potrero', 'Potrero'),
];

interface VenueSeed {
  id: string;
  name: string;
  kind: VenueKind;
  lat: number;
  lon: number;
  district: string;
  entry: [number, number];
  spend: [number, number];
  vibe: string[];
  blurb: string;
  heat: number;
}

const SEEDS: VenueSeed[] = [
  {
    id: 'foreign', name: 'Foreign Cinema', kind: 'dinner', lat: 37.7563, lon: -122.4189,
    district: 'sf-mission', entry: [0, 0], spend: [45, 80], heat: 0.42,
    vibe: ['Courtyard', 'Date night', 'Films on the wall'],
    blurb: 'Films projected on the courtyard wall. Book it or queue at the bar.',
  },
  {
    id: 'richtable', name: 'Rich Table', kind: 'dinner', lat: 37.7745, lon: -122.4227,
    district: 'sf-hayes', entry: [0, 0], spend: [55, 95], heat: 0.36,
    vibe: ['Small plates', 'Loud', 'Worth it'],
    blurb: 'Sardine chips and porcini doughnuts. Walk-ins at the counter.',
  },
  {
    id: 'nopa', name: 'Nopa', kind: 'dinner', lat: 37.7748, lon: -122.4376,
    district: 'sf-divis', entry: [0, 0], spend: [40, 75], heat: 0.55,
    vibe: ['Late kitchen', 'Buzzing', 'Big room'],
    blurb: 'Kitchen runs to 1am. The reason people eat late in this city.',
  },
  {
    id: 'zeitgeist', name: 'Zeitgeist', kind: 'bar', lat: 37.7699, lon: -122.4222,
    district: 'sf-mission', entry: [0, 0], spend: [18, 30], heat: 0.78,
    vibe: ['Beer garden', 'Loud', 'No frills'],
    blurb: 'Big yard, cash-friendly, tamales guy usually out front by ten.',
  },
  {
    id: 'trickdog', name: 'Trick Dog', kind: 'bar', lat: 37.7592, lon: -122.4108,
    district: 'sf-mission', entry: [0, 0], spend: [26, 44], heat: 0.66,
    vibe: ['Cocktails', 'Design-y', 'Upstairs'],
    blurb: 'Menu changes theme every six months. Upstairs is quieter.',
  },
  {
    id: 'marlena', name: 'Marlena', kind: 'bar', lat: 37.7765, lon: -122.4238,
    district: 'sf-hayes', entry: [0, 0], spend: [22, 38], heat: 0.51,
    vibe: ['Queer', 'Warm', 'Good playlist'],
    blurb: 'Neighbourhood bar that actually feels like one.',
  },
  {
    id: 'abv', name: 'ABV', kind: 'bar', lat: 37.7648, lon: -122.4213,
    district: 'sf-mission', entry: [0, 0], spend: [20, 36], heat: 0.58,
    vibe: ['Bartenders', 'Late food', 'Standing'],
    blurb: 'Where the industry drinks after their own shifts.',
  },
  {
    id: 'monarch', name: 'Monarch', kind: 'club', lat: 37.7797, lon: -122.409,
    district: 'sf-soma', entry: [15, 30], spend: [45, 90], heat: 0.92,
    vibe: ['House', 'Two floors', 'Dress up'],
    blurb: 'Upstairs cocktails, downstairs sweat. Sound system is the point.',
  },
  {
    id: 'audio', name: 'Audio', kind: 'club', lat: 37.7714, lon: -122.4131,
    district: 'sf-soma', entry: [20, 35], spend: [50, 95], heat: 0.83,
    vibe: ['Techno', 'Funktion-One', 'Late'],
    blurb: 'Built around the rig. Go for the sound, stay because you cannot leave.',
  },
  {
    id: '1015', name: '1015 Folsom', kind: 'club', lat: 37.7784, lon: -122.4062,
    district: 'sf-soma', entry: [25, 40], spend: [55, 110], heat: 0.71,
    vibe: ['Five rooms', 'Big night', 'Bottle service'],
    blurb: 'Five rooms, five completely different nights happening at once.',
  },
  {
    id: 'greatnorthern', name: 'The Great Northern', kind: 'club', lat: 37.7676, lon: -122.4063,
    district: 'sf-potrero', entry: [20, 35], spend: [45, 85], heat: 0.64,
    vibe: ['Warehouse', 'Disco', 'High ceilings'],
    blurb: 'Old warehouse, proper disco ball, room to actually dance.',
  },
  {
    id: 'chapel', name: 'The Chapel', kind: 'club', lat: 37.7597, lon: -122.4215,
    district: 'sf-mission', entry: [18, 32], spend: [38, 70], heat: 0.69,
    vibe: ['Live', 'Balcony', 'Beautiful room'],
    blurb: 'Former mortuary, 40-foot ceilings. Balcony is the best seat in the Mission.',
  },
  {
    id: 'halcyon', name: 'Halcyon', kind: 'club', lat: 37.7735, lon: -122.4155,
    district: 'sf-soma', entry: [10, 25], spend: [35, 65], heat: 0.48,
    vibe: ['Intimate', 'House', 'No phones on the floor'],
    blurb: 'Small, dark, serious about the music. Gets going after one.',
  },
];

export const SF_VENUES: readonly Venue[] = SEEDS.map((s) => ({
  id: asVenueId(s.id),
  name: s.name,
  kind: s.kind,
  at: { lat: s.lat, lon: s.lon },
  districtId: asDistrictId(s.district),
  cityId: SAN_FRANCISCO.id,
  vibe: s.vibe,
  entry: {
    min: money(s.entry[0] * 100, SAN_FRANCISCO.currency),
    max: money(s.entry[1] * 100, SAN_FRANCISCO.currency),
  },
  spend: {
    min: money(s.spend[0] * 100, SAN_FRANCISCO.currency),
    max: money(s.spend[1] * 100, SAN_FRANCISCO.currency),
  },
  blurb: s.blurb,
  verified: true,
}));

/** Baseline heat, before any of this device's ratings are layered on. */
export const SF_BASE_HEAT: Readonly<Record<string, number>> = Object.fromEntries(
  SEEDS.map((s) => [s.id, s.heat]),
);

export const SEED_CITIES: readonly City[] = [SAN_FRANCISCO, LOS_ANGELES];
export const SEED_COUNTRIES: readonly Country[] = [USA];
export const SEED_REGIONS: readonly Region[] = [CALIFORNIA];
