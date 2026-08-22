/**
 * Import from the frozen web prototype's `func:v1` store.
 *
 * Phoenix's handover made data preservation non-negotiable and asked
 * explicitly that old data be tested loading into the new system. Inspecting
 * the live store found 3.1KB of pure QA residue and no real users, so nothing
 * of value is actually at stake — but "there is nothing to lose" is a finding,
 * not a licence to skip the work. Writing the importer proves the schema
 * mapping is real rather than asserted, and if a device somewhere does still
 * hold prototype state, it survives.
 *
 * Everything here is a mapping decision. The ones with judgement in them are
 * commented, because a migration is where assumptions get baked in silently.
 */

import {
  moneyFromMajorUnits,
  type AccessRequest,
  type Account,
  type CheckIn,
  type Interest,
  type Message,
  type Pass,
  type Presence,
  type SavedItem,
  type Spot,
  type Story,
  type TableOffer,
  type Thread,
  type Visit,
} from '../../domain';
import type { Business } from '../../domain/venues';
import { SYSTEM } from '../../domain/threads';
import type { Profile } from '../../domain/accounts';
import { emptyState, type PersistedState } from '../schema';

/** The prototype's on-disk key and the only version it ever shipped. */
export const LEGACY_KEY = 'func:v1';
export const LEGACY_VERSION = 4;

/**
 * The prototype had no currency concept — it was San Francisco in dollars, per
 * standing orders. Anything imported is therefore USD by definition.
 */
const LEGACY_CURRENCY = 'USD';

type Json = Record<string, unknown>;

const arr = (v: unknown): Json[] => (Array.isArray(v) ? (v as Json[]) : []);
const obj = (v: unknown): Json => (v && typeof v === 'object' ? (v as Json) : {});
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const bool = (v: unknown): boolean => v === true;

export function looksLikeLegacy(raw: unknown): boolean {
  const doc = obj(raw);
  return typeof doc['version'] === 'number' && 'peopleStatus' in doc && 'requests' in doc;
}

/**
 * Convert a legacy root into current state.
 *
 * `now` is passed in rather than read, so a migration test can assert what
 * happens to presence that has already lapsed.
 */
export function importLegacy(raw: unknown, now: number): PersistedState {
  const doc = obj(raw);
  const state = emptyState();

  // ---- session ----------------------------------------------------------
  const session = obj(doc['session']);
  state.session.personId = typeof session['personId'] === 'string'
    ? (session['personId'] as PersistedState['session']['personId'])
    : null;

  // ---- presence ---------------------------------------------------------
  // The traffic light maps across directly, with one wrinkle: 'disco' was both
  // a status and the premium badge. It means "green, and paying", so it lands
  // as dtf and the premium flag is set from the account instead.
  const peopleStatus = obj(doc['peopleStatus']);
  for (const [id, value] of Object.entries(peopleStatus)) {
    const entry = obj(value);
    const legacyStatus = str(entry['status'], 'red');
    const expiresAt = entry['statusExpiresAt'];

    let presence: Presence = { kind: 'off' };
    if (legacyStatus !== 'red') {
      // Carry the window the user actually had rather than recomputing it to
      // the new next-noon rule. Extending someone's visibility during a
      // migration would be granting exposure they never agreed to; anything
      // already lapsed simply arrives off.
      const expiry = typeof expiresAt === 'number' ? expiresAt : null;
      if (expiry !== null && expiry > now) {
        presence = {
          kind: legacyStatus === 'amber' ? 'casual' : 'dtf',
          since: num(entry['statusSetAt'], now),
          expiresAt: expiry,
        };
      }
    }

    state.presence[id] = {
      presence,
      // The mutuals setting did not exist. Default it off — a migration must
      // never grant a sharing permission the user was never asked for.
      shareWithMutuals: false,
    };
  }

  // ---- accounts ---------------------------------------------------------
  const accounts = obj(doc['accounts']);
  for (const [id, value] of Object.entries(accounts)) {
    const a = obj(value);
    const v = obj(a['verification']);
    const status = str(v['status'], 'unverified');
    const role = str(a['role'], 'consumer') === 'business' ? 'business' : 'consumer';

    state.accounts[id] = {
      id: id as Account['id'],
      role,
      businessId: role === 'business' ? (id as NonNullable<Account['businessId']>) : null,
      email: typeof a['email'] === 'string' ? a['email'] : null,
      phone: typeof a['phone'] === 'string' ? a['phone'] : null,
      dateOfBirth: typeof a['dob'] === 'string' ? a['dob'] : null,
      verification: {
        status:
          status === 'verified' || status === 'rejected' || status === 'pending'
            ? status
            : 'unverified',
        method: v['method'] === 'id_upload' || v['method'] === 'id_scan' ? v['method'] : null,
        submittedAt: typeof v['submittedAt'] === 'number' ? v['submittedAt'] : null,
        resolvedAt: typeof v['verifiedAt'] === 'number' ? v['verifiedAt'] : null,
        // The prototype rejected for exactly one reason — failing the age
        // check — so a rejected record can be attributed confidently.
        rejectionReason: status === 'rejected' ? 'under_age' : null,
      },
      profileComplete: bool(a['profileComplete']),
      onboardingComplete: bool(a['onboardingComplete']),
      premium: bool(a['premium']),
      createdAt: num(a['createdAt'], now),
    };
  }

  // ---- people created at runtime become profiles -------------------------
  for (const p of arr(doc['newPeople'])) {
    const id = str(p['id']);
    if (!id) continue;
    state.profiles[id] = {
      personId: id as Profile['personId'],
      name: str(p['name'], 'Someone'),
      bio: str(p['bio']),
      instagram: str(p['ig']) || null,
      photoUris: [],
      tokens: num(p['tokens']),
      spotsDropped: num(p['spots']),
      nightsOut: num(p['nights']),
    };
    // A person with no status entry still needs a presence record, or every
    // read has to cope with a missing key.
    state.presence[id] ??= { presence: { kind: 'off' }, shareWithMutuals: false };
  }

  // ---- businesses --------------------------------------------------------
  for (const b of arr(doc['newBusinesses'])) {
    const id = str(b['id']);
    if (!id) continue;
    state.businesses[id] = {
      id: id as Business['id'],
      name: str(b['name'], 'Business'),
      // 'promoter' was the only kind the prototype created.
      kind: 'promoter',
      venueIds: arr(b['venueIds']).length
        ? (b['venueIds'] as Business['venueIds'])
        : ((Array.isArray(b['venueIds']) ? b['venueIds'] : []) as Business['venueIds']),
      verified: bool(b['verified']),
      bio: str(b['bio']),
    };
  }

  // ---- access ------------------------------------------------------------
  for (const r of arr(doc['requests'])) {
    const id = str(r['id']);
    if (!id) continue;
    const status = str(r['status'], 'pending');
    state.requests.push({
      id: id as AccessRequest['id'],
      kind: str(r['kind']) === 'after' ? 'after' : 'table',
      guestId: str(r['guestId']) as AccessRequest['guestId'],
      hostId: str(r['hostId']) as AccessRequest['hostId'],
      // Party size was optional early on and defaulted to one at read time.
      partySize: Math.max(1, num(r['partySize'], 1)),
      venueId: (str(r['venueId']) || null) as AccessRequest['venueId'],
      tableId: (str(r['tableId']) || null) as AccessRequest['tableId'],
      afterId: (str(r['afterId']) || null) as AccessRequest['afterId'],
      status:
        status === 'accepted' || status === 'declined' || status === 'cancelled'
          ? status
          : 'pending',
      createdAt: num(r['createdAt'], now),
      respondedAt: typeof r['respondedAt'] === 'number' ? r['respondedAt'] : null,
      declineReason: typeof r['declineReason'] === 'string' ? r['declineReason'] : null,
      passId: (str(r['passId']) || null) as AccessRequest['passId'],
      threadId: (str(r['threadId']) || null) as AccessRequest['threadId'],
    });
  }

  for (const p of arr(doc['passes'])) {
    const id = str(p['id']);
    const venueId = str(p['venueId']);
    // A pass with no venue cannot be shown on a door or rated; there is
    // nothing to preserve.
    if (!id || !venueId) continue;
    state.passes.push({
      id: id as Pass['id'],
      requestId: str(p['requestId']) as Pass['requestId'],
      guestId: str(p['guestId']) as Pass['guestId'],
      partySize: Math.max(1, num(p['partySize'], 1)),
      venueId: venueId as Pass['venueId'],
      tableId: (str(p['tableId']) || null) as Pass['tableId'],
      code: str(p['code']),
      issuedAt: num(p['issuedAt'], now),
      status: 'active',
      rated: bool(p['rated']),
    });
  }

  // ---- threads and messages ----------------------------------------------
  for (const t of arr(doc['threads'])) {
    const id = str(t['id']);
    if (!id) continue;
    state.threads.push({
      id: id as Thread['id'],
      requestId: str(t['requestId']) as Thread['requestId'],
      participantIds: (Array.isArray(t['participantIds'])
        ? t['participantIds']
        : []) as Thread['participantIds'],
      status: str(t['status']) === 'closed' ? 'closed' : 'open',
      createdAt: num(t['createdAt'], now),
      lastMessageAt: num(t['lastMessageAt'], num(t['createdAt'], now)),
    });
  }

  for (const m of arr(doc['messages'])) {
    const id = str(m['id']);
    if (!id) continue;
    const senderId = str(m['senderId']);
    state.messages.push({
      id: id as Message['id'],
      threadId: str(m['threadId']) as Message['threadId'],
      // The prototype encoded system messages as the literal sender id
      // 'system'. That is now a distinct variant so it cannot be mistaken for
      // a participant — or impersonated by an account named "system".
      sender: senderId === 'system' ? SYSTEM : { kind: 'actor', id: senderId as never },
      body: str(m['body']),
      sentAt: num(m['sentAt'], now),
      readBy: (Array.isArray(m['readBy']) ? m['readBy'] : []) as Message['readBy'],
    });
  }

  // ---- tables ------------------------------------------------------------
  for (const t of arr(doc['newTables'])) {
    const id = str(t['id']);
    if (!id) continue;
    state.tables.push({
      id: id as TableOffer['id'],
      // The legacy field was `venue`, not `venueId`.
      venueId: str(t['venue']) as TableOffer['venueId'],
      businessId: str(t['businessId']) as TableOffer['businessId'],
      name: str(t['name'], 'Table'),
      seats: Math.max(1, num(t['seats'], 1)),
      // Stored as float dollars. Converting through minor units here is the
      // point at which the old rounding bug stops being able to recur.
      perHead: moneyFromMajorUnits(num(t['perHead']), LEGACY_CURRENCY),
      vibe: str(t['vibe']),
    });
  }

  // ---- spots and visits ---------------------------------------------------
  for (const v of arr(doc['visits'])) {
    const spotId = str(v['spotId']);
    const personId = str(v['personId']);
    if (!spotId || !personId) continue;
    state.visits.push({
      spotId: spotId as Visit['spotId'],
      personId: personId as Visit['personId'],
      at: num(v['at'], now),
    });
  }

  for (const s of arr(doc['newSpots'])) {
    const id = str(s['id']);
    if (!id) continue;
    const spotId = id as Spot['id'];
    state.spots.push({
      id: spotId,
      name: str(s['name'], 'Local spot'),
      note: str(s['note']),
      at: { lat: num(s['lat']), lon: num(s['lon']) },
      droppedBy: str(s['byId']) as Spot['droppedBy'],
      droppedAt: num(s['droppedAt'], now),
      // Recounted from the visit log rather than trusting the stored total.
      // The two could already disagree, and the log is the truth.
      tokens: new Set(
        state.visits.filter((v) => v.spotId === spotId).map((v) => v.personId),
      ).size,
    });
  }

  // ---- stories and check-ins ----------------------------------------------
  for (const c of arr(doc['checkins'])) {
    const personId = str(c['personId']);
    const venueId = str(c['venueId']);
    if (!personId || !venueId) continue;
    state.checkIns.push({
      personId: personId as CheckIn['personId'],
      venueId: venueId as CheckIn['venueId'],
      at: num(c['at'], now),
      expiresAt: num(c['expiresAt'], now),
    });
  }

  for (const s of arr(doc['newStories'])) {
    const id = str(s['id']);
    if (!id) continue;
    const gradient = Array.isArray(s['g']) ? (s['g'] as string[]) : [];
    state.stories.push({
      id: id as Story['id'],
      by: str(s['by']) as Story['by'],
      venueId: (str(s['venue']) || null) as Story['venueId'],
      postedAt: num(s['postedAt'], now),
      verifiedAtVenue: bool(s['atVenue']),
      gradient: [gradient[0] ?? '#12E08A', gradient[1] ?? '#0B7A5B'],
    });
  }

  // ---- engagement ----------------------------------------------------------
  for (const s of arr(doc['saved'])) {
    const personId = str(s['personId']);
    const refId = str(s['refId']);
    if (!personId || !refId) continue;
    state.saved.push({
      personId: personId as SavedItem['personId'],
      kind: str(s['kind']) === 'spot' ? 'spot' : 'venue',
      refId: refId as SavedItem['refId'],
      savedAt: num(s['at'], now),
    });
  }

  for (const i of arr(doc['interest'])) {
    const fromId = str(i['fromId']);
    const toId = str(i['toId']);
    if (!fromId || !toId || fromId === toId) continue;
    state.interest.push({
      fromId: fromId as Interest['fromId'],
      toId: toId as Interest['toId'],
      at: num(i['at'], now),
    });
  }

  // ---- heat -----------------------------------------------------------------
  for (const [venueId, heat] of Object.entries(obj(doc['venueHeat']))) {
    if (typeof heat === 'number' && Number.isFinite(heat)) {
      state.venueHeat[venueId] = heat;
    }
  }

  // Note on what is deliberately NOT imported: friendships. The prototype had
  // no relationship edges at all — `friend: true` and `mutual: 3` were flags
  // stamped on seed people, meaning "relative to the demo user". There is no
  // per-viewer graph in the old data to carry across, so `friendships` starts
  // empty rather than being invented from single-viewer flags.

  return state;
}
