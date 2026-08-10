/**
 * The persisted shape.
 *
 * One versioned document holding everything the app has been told. The domain
 * is pure functions over slices of this, so the store's whole job is to hand
 * out slices, apply the results, and survive a schema change.
 *
 * The prototype's store had no migration path at all: a version bump made
 * `load()` fall through to a fresh root, silently discarding everything. That
 * is the specific failure this file and `migrations/` exist to prevent.
 */

import type {
  AccessRequest,
  Account,
  CheckIn,
  Interest,
  Pass,
  PresenceProfile,
  SavedItem,
  Spot,
  Story,
  TableOffer,
  Thread,
  Message,
  Visit,
} from '../domain';
import type { AfterParty } from '../domain/access';
import type { LocationFix } from '../domain/presence';
import type { Business } from '../domain/venues';
import type { Profile } from '../domain/accounts';
import type { ActorId, PersonId, VenueId } from '../domain/ids';

/**
 * Bump this whenever `PersistedState`'s shape changes, and add a migration in
 * the same commit. A version with no migration is a data-loss bug.
 */
export const SCHEMA_VERSION = 2;

/**
 * Relationship edges.
 *
 * Stored as an explicit adjacency list rather than as flags on a person, which
 * is what made the prototype's social graph single-viewer. Friendship is
 * symmetric, so the store keeps both directions in step — see
 * `data/graph.ts`.
 */
export interface FriendEdge {
  readonly a: PersonId;
  readonly b: PersonId;
  readonly since: number;
}

export interface PersistedState {
  /** Who is signed in on this device. Null when logged out. */
  session: { personId: ActorId | null };

  accounts: Record<string, Account>;
  profiles: Record<string, Profile>;
  businesses: Record<string, Business>;

  /** Presence and the settings governing it, keyed by person. */
  presence: Record<string, PresenceProfile>;
  friendships: FriendEdge[];

  requests: AccessRequest[];
  passes: Pass[];
  threads: Thread[];
  messages: Message[];

  tables: TableOffer[];
  afterParties: AfterParty[];

  spots: Spot[];
  visits: Visit[];
  stories: Story[];
  checkIns: CheckIn[];

  saved: SavedItem[];
  interest: Interest[];

  /**
   * Last known position for each person this device may see.
   *
   * Added in v2. Fixes were originally held in React state only, which meant
   * every friend — and the user's own dot — vanished on relaunch. In
   * production these arrive from a server that has already applied the
   * visibility rules; locally they are persisted so the app survives a reload.
   */
  fixes: Record<string, LocationFix>;

  /**
   * Heat adjustments layered over whatever the venue source reports.
   *
   * Kept as an overlay rather than written into the venue itself: venues come
   * from a place repository that will eventually be a remote service, and this
   * device's ratings are not its to own.
   */
  venueHeat: Record<string, number>;
}

export interface PersistedDocument {
  readonly schemaVersion: number;
  readonly state: PersistedState;
}

export function emptyState(): PersistedState {
  return {
    session: { personId: null },
    accounts: {},
    profiles: {},
    businesses: {},
    presence: {},
    friendships: [],
    requests: [],
    passes: [],
    threads: [],
    messages: [],
    tables: [],
    afterParties: [],
    spots: [],
    visits: [],
    stories: [],
    checkIns: [],
    saved: [],
    interest: [],
    fixes: {},
    venueHeat: {},
  };
}

export function emptyDocument(): PersistedDocument {
  return { schemaVersion: SCHEMA_VERSION, state: emptyState() };
}

/** Heat for a venue, falling back to whatever the place source reported. */
export function heatFor(
  state: PersistedState,
  venueId: VenueId,
  fallback: number,
): number {
  const overlay = state.venueHeat[venueId as string];
  return overlay === undefined ? fallback : overlay;
}
