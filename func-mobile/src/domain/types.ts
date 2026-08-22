/**
 * Domain types for func.
 *
 * The account, live-status and Pool invite shapes below are implemented
 * exactly as specified in the product brief — do not extend them casually.
 * Everything else (Venue, Group, chat, message requests, stories) is the
 * minimum supporting cast needed for the prototype to be interactive.
 */

// ---------------------------------------------------------------------------
// Accounts & live status (locked shape)
// ---------------------------------------------------------------------------

export type AccountType = 'personal' | 'business';
export type LiveStatus = 'dtf' | 'casual' | 'off';

export interface FuncUser {
  id: string;
  handle: string;
  personalProfile: PersonalProfile;
  businessProfile?: BusinessProfile;
  activeProfile: AccountType;
}

export interface PersonalProfile {
  displayName: string;
  photo: string;
  liveStatus: LiveStatus;
  lastKnownLocation?: { lat: number; lng: number; timestamp: string };
  premium: boolean;
}

export interface BusinessProfile {
  venueName: string;
  // no liveStatus field at all — business accounts never have live status
}

// ---------------------------------------------------------------------------
// Pool invites (locked shape) — the one unified "event" object
// ---------------------------------------------------------------------------

export interface PoolInvite {
  id: string;
  hostGroupId: string;
  description: string;
  location: { lat: number; lng: number };
  capacity: { mode: 'capped' | 'uncapped'; max?: number };
  access: { mode: 'private' | 'public' };
  requests: PoolRequest[];
  attendeeGroupIds: string[];
  groupChatId: string;
  createdByAccountType: AccountType;
  /** Optional — the Create form allows an optional date/time. ISO string. */
  startsAt?: string;
  /** Seed bookkeeping only; ordering in lists. ISO string. */
  createdAt: string;
}

export interface PoolRequest {
  requestingGroupId: string;
  partySize: number;
  status: 'pending' | 'accepted' | 'denied';
  preAcceptMessage?: {
    text: string;
    messageRequestStatus: 'pending' | 'accepted';
  };
}

// ---------------------------------------------------------------------------
// Supporting entities
// ---------------------------------------------------------------------------

/**
 * A "group" here is just the party a user is out with tonight — an id and the
 * user ids in it. There is nothing to name or administrate; party size lives
 * on the request (see PoolRequest.partySize).
 */
export interface Group {
  id: string;
  /** The user who speaks for the party (hosts, requests, gets the chat). */
  leadUserId: string;
  memberUserIds: string[];
}

export type VenueCategory =
  | 'restaurant'
  | 'bar'
  | 'club'
  | 'cafe'
  | 'daytime'
  | 'shop';

/** Soft price signal — rendered as one to four currency symbols, never sorted/filtered on. */
export type PriceTier = 1 | 2 | 3 | 4;

export interface Venue {
  id: string;
  name: string;
  category: VenueCategory;
  /** Free-text area label used by search ("Mission", "SoMa"...). */
  area: string;
  location: { lat: number; lng: number };
  priceTier: PriceTier;
  blurb: string;
}

export interface ChatMessage {
  id: string;
  senderUserId: string;
  text: string;
  sentAt: string;
}

export interface ChatThread {
  id: string;
  kind: 'pool' | 'dm';
  title: string;
  /** Pool chats are keyed by group; DMs by the two users' solo groups. */
  participantGroupIds: string[];
  poolInviteId?: string;
  messages: ChatMessage[];
}

/** A direct message that must be accepted before it becomes a thread. */
export interface MessageRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  status: 'pending' | 'accepted' | 'denied';
  createdAt: string;
}

export interface Story {
  id: string;
  authorUserId: string;
  text: string;
  createdAt: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}
