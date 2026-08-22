export type DistrictId = 'arches' | 'oldquarter' | 'harbourside' | 'unihill' | 'docks';

// Coarse, non-numeric reputation band (Map v3 spec §3.2). Never render a raw score.
export type Standing = 'new' | 'building' | 'solid' | 'high';

export type StatusRibbon = 'home' | 'down' | 'heading' | 'out';

export interface User {
  id: string;
  name: string;
  age: number; // all 18–26 (spec: adults only)
  gender: 'M' | 'F' | 'NB';
  bio: string;
  interests: string[];
  district: DistrictId;
  groupId?: string;
  verified: boolean;
  standing: Standing;
  nightsClosed: number;
  earnedFriendIds: string[]; // Decision 009: no add-friend button — earned by closing a night together
  roles: string[]; // derived badges, e.g. "Reliable host" — never self-claimed
  status: StatusRibbon;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
  vibe: string;
  lookingFor: string;
  district: DistrictId;
  night: string;
}

export interface PoolInvite {
  id: string;
  groupId: string;
  note: string;
}

export type InboxStatus = 'pending' | 'accepted' | 'denied';

export interface InboxItem {
  id: string;
  direction: 'incoming' | 'outgoing';
  groupId: string; // the other group
  status: InboxStatus;
  note: string;
}

// One priced part of a night out (entry, drinks, food, travel…). Totals are always
// derived from these — never hand-typed (Decision 007).
export interface CostItem {
  label: string;
  emoji: string;
  min: number;
  max: number;
}

export interface FuncEvent {
  id: string;
  title: string;
  venue: string;
  district: DistrictId;
  when: string;
  price: string;
  description: string;
  attendeeIds: string[];
  emoji: string;
  costBreakdown: CostItem[];
}

// A node on the world view (Decision 006). Only Velmont is live in the demo;
// the rest tell the expansion story.
export interface WorldCity {
  id: string;
  name: string;
  x: number;
  y: number;
  size: 1 | 2 | 3;
  out: number;
  live: boolean;
}

export interface DatingCard {
  userId: string;
  alwaysMatch?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  emoji: string;
  x: number;
  y: number;
  district: DistrictId;
  level: 1 | 2 | 3; // activity level
  groupsTonight: number;
  avgSpend: number; // typical all-in night, £
  eventId?: string;
}

export interface HeatPoint {
  x: number;
  y: number;
  w: 1 | 2 | 3; // heat weight → colour tier (purple → pink → cyan)
}

// A venue-anchored ephemeral story — "Flare" (Map v3 spec §2). Never person-anchored;
// there is no stories tab. Posting requires being at the venue (faked here via seed data).
export interface Story {
  id: string;
  venueId: string;
  groupId: string;
  authorId: string;
  minutesAgo: number; // drives decay tint: <120 hot, <360 ember, else gone
  audience: 'group' | 'circles' | 'city';
  gradient: readonly [string, string];
  caption: string;
}

export type VouchType = 'shows_up' | 'great_host' | 'good_with_new_people' | 'looks_out';

// A "Backing" — stake-based vouch, gated by shared attendance (Map v3 spec §3).
// Typed and attributable; no raw count ever renders in the UI.
export interface Vouch {
  fromId: string;
  toId: string;
  type: VouchType;
  nightId: string;
}

// A closed night — the unfakeable receipt behind Standing, earned friends, and heat
// weighting (Map v3 spec §4.3 "Night Record").
export interface Night {
  id: string;
  date: string;
  venueId: string;
  crewIds: string[]; // groups present
  attendeeIds: string[];
}

export type PlanVote = 'in' | 'nah' | null;

// The active "Call It" plan — from proposal through verdict to a locked Plan Flag
// (Map v3 spec §1.6). One plan at a time in the demo store.
export interface Plan {
  venueId: string;
  votes: Record<string, PlanVote>; // keyed by "you"'s crew member ids
  locked: boolean;
  lockedAt?: number; // ms timestamp, for the countdown display
}
