/**
 * A populated world to develop and demo against.
 *
 * Distinct from the place seed: this is the *social* layer — people, real
 * friendship edges, presence, businesses and what they are offering tonight.
 *
 * The important difference from the prototype's seed is that relationships are
 * genuine edges. `friend: true` used to be a flag meaning "friend of the demo
 * user", so mutuals were a number somebody typed. Here Nia is your mutual
 * because she is actually Maya's friend and Maya is actually yours — which
 * means the visibility rules have something real to resolve against.
 */

import {
  asBusinessId,
  asPersonId,
  asTableId,
  asAfterPartyId,
  asVenueId,
  money,
  nextLocalNoon,
  type Account,
  type AfterParty,
  type PresenceProfile,
  type Profile,
  type TableOffer,
} from '../../domain';
import type { Business } from '../../domain/venues';
import { addFriendship } from '../graph';
import { emptyState, type PersistedState } from '../schema';
import { SAN_FRANCISCO, SF_BASE_HEAT } from './san-francisco';

export const DEMO_PERSON_ID = asPersonId('you');

interface PersonSeed {
  id: string;
  name: string;
  bio: string;
  instagram: string | null;
  /** dtf | casual | off */
  presence: 'dtf' | 'casual' | 'off';
  shareWithMutuals: boolean;
  /** Venue they are currently at, for a location fix. */
  at: string | null;
  tokens: number;
  spots: number;
  nights: number;
  premium?: boolean;
}

const PEOPLE: PersonSeed[] = [
  { id: 'you', name: 'Phoenix', bio: 'SF. Down for most things. Ask me about the taqueria on 24th.', instagram: '@phoenixk', presence: 'dtf', shareWithMutuals: true, at: null, tokens: 340, spots: 6, nights: 23 },

  // Friends
  { id: 'p1', name: 'Maya', bio: 'Mission. Always knows where the after is.', instagram: '@mayab', presence: 'dtf', shareWithMutuals: true, at: 'zeitgeist', tokens: 128, spots: 3, nights: 41 },
  { id: 'p2', name: 'Theo', bio: 'Records, mostly.', instagram: null, presence: 'dtf', shareWithMutuals: false, at: 'zeitgeist', tokens: 64, spots: 2, nights: 18 },
  { id: 'p3', name: 'Jules', bio: 'Out but not committing.', instagram: null, presence: 'casual', shareWithMutuals: true, at: null, tokens: 12, spots: 0, nights: 9 },
  { id: 'p4', name: 'Sana', bio: 'Burmese food evangelist.', instagram: '@sana.k', presence: 'dtf', shareWithMutuals: true, at: 'trickdog', tokens: 91, spots: 4, nights: 27 },
  { id: 'p5', name: 'Dre', bio: 'Staying in tonight.', instagram: null, presence: 'off', shareWithMutuals: true, at: null, tokens: 22, spots: 1, nights: 14 },
  { id: 'p6', name: 'Kit', bio: 'Roof, Potrero. Come up.', instagram: '@kit', presence: 'dtf', shareWithMutuals: true, at: 'monarch', tokens: 210, spots: 5, nights: 52, premium: true },

  // Friends-of-friends
  { id: 'm1', name: 'Nia', bio: '', instagram: null, presence: 'dtf', shareWithMutuals: true, at: 'monarch', tokens: 30, spots: 0, nights: 12 },
  { id: 'm2', name: 'Léo', bio: '', instagram: null, presence: 'dtf', shareWithMutuals: true, at: 'audio', tokens: 8, spots: 0, nights: 7 },
  { id: 'm3', name: 'Priya', bio: '', instagram: null, presence: 'dtf', shareWithMutuals: true, at: 'monarch', tokens: 45, spots: 1, nights: 20 },
  // Opted out of mutual sharing — invisible to you even though she is out.
  { id: 'm4', name: 'Owen', bio: '', instagram: null, presence: 'dtf', shareWithMutuals: false, at: 'monarch', tokens: 3, spots: 0, nights: 4 },
  { id: 'm5', name: 'Tasha', bio: '', instagram: null, presence: 'casual', shareWithMutuals: true, at: null, tokens: 17, spots: 0, nights: 11 },
  { id: 'm6', name: 'Marco', bio: '', instagram: null, presence: 'dtf', shareWithMutuals: true, at: '1015', tokens: 62, spots: 2, nights: 33, premium: true },

  // No relationship to you at all — contributes to heat only.
  { id: 'x1', name: 'Someone', bio: '', instagram: null, presence: 'dtf', shareWithMutuals: true, at: 'monarch', tokens: 0, spots: 0, nights: 1 },
];

/** you—friends, and each friend—their own friends, so mutuals are derived. */
const FRIENDSHIPS: [string, string][] = [
  ['you', 'p1'], ['you', 'p2'], ['you', 'p3'], ['you', 'p4'], ['you', 'p5'], ['you', 'p6'],
  ['p1', 'm1'], ['p1', 'm2'],
  ['p2', 'm3'],
  ['p4', 'm4'], ['p4', 'm5'],
  ['p6', 'm6'],
];

const BUSINESSES: Business[] = [
  {
    id: asBusinessId('biz-nightform'), name: 'Nightform', kind: 'promoter',
    venueIds: [asVenueId('monarch'), asVenueId('audio')], verified: true,
    bio: 'Runs the door and the tables at Monarch and Audio.',
  },
  {
    id: asBusinessId('biz-folsom'), name: 'Folsom Collective', kind: 'promoter',
    venueIds: [asVenueId('1015')], verified: true,
    bio: 'Bottle service and mezzanine tables at 1015 Folsom.',
  },
  {
    id: asBusinessId('biz-disco'), name: 'Disco Committee', kind: 'promoter',
    venueIds: [asVenueId('greatnorthern')], verified: true,
    bio: 'The corner banquette at The Great Northern.',
  },
];

const usd = (dollars: number) => money(dollars * 100, SAN_FRANCISCO.currency);

const TABLES: TableOffer[] = [
  { id: asTableId('t1'), venueId: asVenueId('monarch'), businessId: asBusinessId('biz-nightform'), name: 'Booth 5, upstairs', seats: 6, perHead: usd(40), vibe: 'House · dress up' },
  { id: asTableId('t2'), venueId: asVenueId('audio'), businessId: asBusinessId('biz-nightform'), name: 'Rail table', seats: 4, perHead: usd(55), vibe: 'Techno · right by the rig' },
  { id: asTableId('t3'), venueId: asVenueId('1015'), businessId: asBusinessId('biz-folsom'), name: 'Mezzanine table', seats: 8, perHead: usd(65), vibe: 'Bottle service · big night' },
  { id: asTableId('t4'), venueId: asVenueId('greatnorthern'), businessId: asBusinessId('biz-disco'), name: 'Corner banquette', seats: 6, perHead: usd(35), vibe: 'Disco · room to dance' },
];

const AFTER_PARTIES: AfterParty[] = [
  {
    id: asAfterPartyId('a1'), hostId: asPersonId('p6'), area: 'Potrero Hill',
    capacity: 20, baseGoing: 14, vibe: ['Rooftop', 'House', 'BYO'],
    address: '1180 Rhode Island St, Apt 4 — buzzer 4, go straight up',
    note: 'Roof is open till the sun comes up. Bring something, do not bring twelve people.',
  },
  {
    id: asAfterPartyId('a2'), hostId: asPersonId('m1'), area: 'Mission',
    capacity: 12, baseGoing: 9, vibe: ['Flat', 'Garage', 'Chilled'],
    address: '3312 22nd St, ground floor — knock, do not buzz',
    note: 'Neighbours are sound but keep it inside after 3.',
  },
  {
    id: asAfterPartyId('a3'), hostId: asPersonId('m2'), area: 'SoMa',
    capacity: 30, baseGoing: 27, vibe: ['Warehouse', 'Techno', 'Late'],
    address: '55 Bluxome St — side door, text on arrival',
    note: 'Proper rig. Runs till it runs out.',
  },
];

/** Roughly where each venue is, so a seeded person has a plausible fix. */
const VENUE_POINTS: Record<string, { lat: number; lon: number }> = {
  zeitgeist: { lat: 37.7699, lon: -122.4222 },
  trickdog: { lat: 37.7592, lon: -122.4108 },
  monarch: { lat: 37.7797, lon: -122.409 },
  audio: { lat: 37.7714, lon: -122.4131 },
  '1015': { lat: 37.7784, lon: -122.4062 },
};

export interface DemoWorld {
  readonly state: PersistedState;
  /** Where each person's device currently is, keyed by person id. */
  readonly fixes: Readonly<Record<string, { lat: number; lon: number }>>;
}

export function buildDemoWorld(now: number, timeZone = SAN_FRANCISCO.timeZone): DemoWorld {
  const state = emptyState();
  const fixes: Record<string, { lat: number; lon: number }> = {};
  const expiresAt = nextLocalNoon(now, timeZone);

  for (const person of PEOPLE) {
    const id = asPersonId(person.id);

    const profile: Profile = {
      personId: id,
      name: person.name,
      bio: person.bio,
      instagram: person.instagram,
      photoUris: [],
      tokens: person.tokens,
      spotsDropped: person.spots,
      nightsOut: person.nights,
    };
    state.profiles[person.id] = profile;

    const presence: PresenceProfile = {
      presence:
        person.presence === 'off'
          ? { kind: 'off' }
          : { kind: person.presence, since: now - 60 * 60 * 1000, expiresAt },
      shareWithMutuals: person.shareWithMutuals,
    };
    state.presence[person.id] = presence;

    const account: Account = {
      id,
      role: 'consumer',
      businessId: null,
      email: null,
      phone: null,
      dateOfBirth: '1999-01-01',
      verification: {
        status: 'verified', method: 'id_upload',
        submittedAt: now - 86_400_000, resolvedAt: now - 86_400_000, rejectionReason: null,
      },
      profileComplete: true,
      onboardingComplete: true,
      premium: person.premium === true,
      createdAt: now - 86_400_000,
    };
    state.accounts[person.id] = account;

    const point = person.at ? VENUE_POINTS[person.at] : undefined;
    if (point) fixes[person.id] = point;
  }

  // The signed-in demo user starts in the Mission, near 18th & Valencia.
  fixes['you'] = { lat: 37.7665, lon: -122.4207 };

  let edges = state.friendships as readonly (typeof state.friendships)[number][];
  for (const [a, b] of FRIENDSHIPS) {
    edges = addFriendship(edges, asPersonId(a), asPersonId(b), now - 86_400_000);
  }
  state.friendships = [...edges];

  for (const business of BUSINESSES) state.businesses[business.id as string] = business;
  state.tables = [...TABLES];
  state.afterParties = [...AFTER_PARTIES];
  state.venueHeat = { ...SF_BASE_HEAT };
  state.session.personId = DEMO_PERSON_ID;

  // Persisted, not held in React state — otherwise every friend and the user's
  // own dot disappear on relaunch. Found by reloading the app on a simulator.
  for (const [personId, at] of Object.entries(fixes)) {
    state.fixes[personId] = { at, recordedAt: now, accuracyMetres: 12 };
  }

  return { state, fixes };
}
