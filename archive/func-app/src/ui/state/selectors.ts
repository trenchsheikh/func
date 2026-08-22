/**
 * Derived views for screens.
 *
 * Every one of these ends in a domain function. Screens get answers, never
 * inputs to a rule — which is what stops "who can see this?" being re-decided
 * three different ways across three different screens.
 */

import {
  activeCheckIn,
  afterGoingCount,
  defaultPresenceProfile,
  isDtf,
  latestUnratedPass,
  liveStories,
  pendingForHost,
  requestsForGuest,
  resolvePresence,
  savedFor,
  storiesAtVenue,
  tableSeatsLeft,
  venuePresence,
  visibleLocation,
  type AccessRequest,
  type ActorId,
  type AfterParty,
  type Pass,
  type PersonId,
  type Presence,
  type PresenceProfile,
  type SavedKind,
  type Story,
  type TableOffer,
  type Venue,
  type VenueId,
} from '../../domain';
import type { PersonPresenceSnapshot, VenuePresenceView } from '../../domain/visibility';
import type { Profile } from '../../domain/accounts';
import type { Business } from '../../domain/venues';
import { heatFor, type PersistedState } from '../../data/schema';
import type { AppContextValue } from './AppProvider';

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------

export function presenceOf(state: PersistedState, personId: string): PresenceProfile {
  return state.presence[personId] ?? defaultPresenceProfile;
}

export function snapshotOf(app: AppContextValue, personId: PersonId): PersonPresenceSnapshot {
  return {
    id: personId,
    profile: presenceOf(app.state, personId as string),
    fix: app.fixes[personId as string] ?? null,
  };
}

export function myPresence(app: AppContextValue): Presence {
  if (!app.meId) return { kind: 'off' };
  return resolvePresence(presenceOf(app.state, app.meId as string).presence, app.clock.now());
}

export function amDtf(app: AppContextValue): boolean {
  if (!app.meId) return false;
  return isDtf(presenceOf(app.state, app.meId as string), app.clock.now());
}

export function profileOf(state: PersistedState, personId: string): Profile | null {
  return state.profiles[personId] ?? null;
}

export function displayName(state: PersistedState, actorId: string): string {
  return (
    state.profiles[actorId]?.name ?? state.businesses[actorId]?.name ?? 'Someone'
  );
}

// ---------------------------------------------------------------------------
// Who is where
// ---------------------------------------------------------------------------

/**
 * Everyone whose device is currently inside a venue's geofence.
 *
 * Position, not intent — this is the raw input to the visibility rules, and is
 * never rendered directly.
 */
function peopleAtVenues(app: AppContextValue): { person: PersonPresenceSnapshot; venueId: VenueId }[] {
  const out: { person: PersonPresenceSnapshot; venueId: VenueId }[] = [];
  for (const personId of Object.keys(app.state.profiles)) {
    const fix = app.fixes[personId];
    if (!fix) continue;
    const venue = nearestVenueWithin(app, fix.at.lat, fix.at.lon);
    if (!venue) continue;
    out.push({ person: snapshotOf(app, personId as PersonId), venueId: venue.id });
  }
  return out;
}

const VENUE_PRESENCE_RADIUS_M = 90;

function nearestVenueWithin(app: AppContextValue, lat: number, lon: number): Venue | null {
  let best: { venue: Venue; metres: number } | null = null;
  for (const venue of app.places.allVenues()) {
    const metres = haversine(lat, lon, venue.at.lat, venue.at.lon);
    if (metres > VENUE_PRESENCE_RADIUS_M) continue;
    if (!best || metres < best.metres) best = { venue, metres };
  }
  return best?.venue ?? null;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_008.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** What the signed-in user may know about who is at a venue. */
export function presenceAtVenue(app: AppContextValue, venueId: VenueId): VenuePresenceView {
  if (!app.meId) return { venueId, friends: [], mutualCount: 0 };
  return venuePresence(
    snapshotOf(app, app.meId),
    peopleAtVenues(app),
    venueId,
    app.graph,
    app.clock.now(),
  );
}

/** Venue-presence for every venue at once — one pass, for the map. */
export function presenceByVenue(app: AppContextValue): Map<string, VenuePresenceView> {
  const result = new Map<string, VenuePresenceView>();
  if (!app.meId) return result;

  const me = snapshotOf(app, app.meId);
  const everyone = peopleAtVenues(app);
  const now = app.clock.now();

  for (const venue of app.places.allVenues()) {
    result.set(
      venue.id as string,
      venuePresence(me, everyone, venue.id, app.graph, now),
    );
  }
  return result;
}

/** Friends whose exact position the viewer may see, for the map's people layer. */
export function visibleFriends(
  app: AppContextValue,
): { id: PersonId; name: string; at: { lat: number; lon: number } }[] {
  if (!app.meId) return [];
  const me = snapshotOf(app, app.meId);
  const now = app.clock.now();
  const out: { id: PersonId; name: string; at: { lat: number; lon: number } }[] = [];

  for (const personId of Object.keys(app.state.profiles)) {
    if (personId === (app.meId as string)) continue;
    const subject = snapshotOf(app, personId as PersonId);
    const relationship = app.graph.relationship(app.meId, personId as PersonId);
    const seen = visibleLocation(me, subject, relationship, now);
    if (seen.precision !== 'exact') continue;
    out.push({
      id: personId as PersonId,
      name: displayName(app.state, personId),
      at: seen.at,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------

export interface VenueSummary {
  readonly venue: Venue;
  readonly heat: number;
  readonly stories: readonly Story[];
  readonly presence: VenuePresenceView;
  readonly tables: readonly TableOffer[];
}

export function venueSummary(app: AppContextValue, venue: Venue): VenueSummary {
  return {
    venue,
    heat: heatFor(app.state, venue.id, 0.3),
    stories: storiesAtVenue(app.state.stories, venue.id, app.clock.now()),
    presence: presenceAtVenue(app, venue.id),
    tables: app.state.tables.filter((t) => t.venueId === venue.id),
  };
}

export function seatsLeft(app: AppContextValue, table: TableOffer): number {
  return tableSeatsLeft(table, app.state.requests);
}

export function afterHeadcount(app: AppContextValue, after: AfterParty): number {
  return afterGoingCount(after, app.state.requests);
}

// ---------------------------------------------------------------------------
// Plans, inbox, business
// ---------------------------------------------------------------------------

export function myRequests(app: AppContextValue): readonly AccessRequest[] {
  if (!app.meId) return [];
  return requestsForGuest(app.state.requests, app.meId).slice().sort((a, b) => b.createdAt - a.createdAt);
}

export function myPasses(app: AppContextValue): readonly Pass[] {
  if (!app.meId) return [];
  return app.state.passes.filter((p) => p.guestId === app.meId).sort((a, b) => b.issuedAt - a.issuedAt);
}

/**
 * Requests waiting on the signed-in actor.
 *
 * Covers both hats: a person hosting an after-party, and any business this
 * account is. The prototype keyed host identity off a business id, which meant
 * a person hosting an after-party saw an empty queue.
 */
export function awaitingMyDecision(app: AppContextValue): readonly AccessRequest[] {
  if (!app.meId) return [];
  const hats: ActorId[] = [app.meId, ...myBusinesses(app).map((b) => b.id)];
  const seen = new Set<string>();
  const out: AccessRequest[] = [];
  for (const hat of hats) {
    for (const request of pendingForHost(app.state.requests, hat)) {
      if (seen.has(request.id as string)) continue;
      seen.add(request.id as string);
      out.push(request);
    }
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Businesses this account operates.
 *
 * A business is its own actor, so the account id and the business id are the
 * same string — the seam where both identity bugs in the bug hunt lived.
 */
export function myBusinesses(app: AppContextValue): readonly Business[] {
  if (!app.meId) return [];
  const mine = app.state.businesses[app.meId as string];
  return mine ? [mine] : [];
}

export function unratedPass(app: AppContextValue): Pass | null {
  if (!app.meId) return null;
  return latestUnratedPass(app.state.passes, app.meId);
}

export function myCheckIn(app: AppContextValue) {
  if (!app.meId) return null;
  return activeCheckIn(app.state.checkIns, app.meId, app.clock.now());
}

export function myStories(app: AppContextValue): readonly Story[] {
  if (!app.meId) return [];
  return liveStories(app.state.stories, app.clock.now()).filter((s) => s.by === app.meId);
}

export interface SavedView {
  readonly kind: SavedKind;
  readonly refId: string;
  readonly name: string;
  readonly sub: string;
  /** Route target — dead if the venue/spot has since been removed. */
  readonly href: `/venue/${string}` | null;
}

/**
 * Saved venues and spots, newest first.
 *
 * The prototype's Plans screen had a "Saved" section; the migration dropped
 * it, which left `saveItem`/`unsaveItem` writing data nothing ever read back.
 */
export function mySaved(app: AppContextValue): readonly SavedView[] {
  if (!app.meId) return [];
  return savedFor(app.state.saved, app.meId).map((item) => {
    if (item.kind === 'venue') {
      const venue = app.places.venueByIdSync(item.refId as VenueId);
      return {
        kind: item.kind,
        refId: item.refId as string,
        name: venue?.name ?? 'Somewhere',
        sub: venue?.kind ?? 'place',
        href: venue ? `/venue/${item.refId as string}` : null,
      };
    }
    const spot = app.state.spots.find((s) => (s.id as string) === (item.refId as string));
    return {
      kind: item.kind,
      refId: item.refId as string,
      name: spot?.name ?? 'Somewhere',
      sub: 'local spot',
      href: spot ? `/venue/spot-${item.refId as string}` : null,
    };
  });
}
