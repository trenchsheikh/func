/*
 * Runtime verification of access, accounts, spots and stories.
 *
 * Same stopgap as rules-check.js: Node is not installed, so the TypeScript in
 * src/domain cannot be compiled or unit tested. Below the divider the code is a
 * line-for-line transcription of the domain source with type annotations
 * removed, so the rules can be executed for real today.
 *
 * Delete this the day Node arrives. Rules change in the TypeScript first.
 *
 * Wrapped in an IIFE: this and rules-check.js are both classic scripts sharing
 * one global scope, and both declare a `results` accumulator.
 */
(function () {

/* ===== transcribed from src/domain/access.ts ============================== */

const MIN_PARTY_SIZE = 1, MAX_PARTY_SIZE = 6, FREE_PENDING_CAP = 3;
const okR = (value) => ({ ok: true, value });
const failR = (error) => ({ ok: false, error });
const sameActor = (a, b) => a === b;

function isValidPartySize(size) {
  return Number.isInteger(size) && size >= MIN_PARTY_SIZE && size <= MAX_PARTY_SIZE;
}

function seatsTaken(requests, target) {
  return requests
    .filter((r) => {
      if (r.status !== 'accepted') return false;
      return 'tableId' in target ? r.tableId === target.tableId : r.afterId === target.afterId;
    })
    .reduce((sum, r) => sum + r.partySize, 0);
}

function tableSeatsLeft(table, requests) {
  return Math.max(0, table.seats - seatsTaken(requests, { tableId: table.id }));
}
function afterGoingCount(after, requests) {
  return after.baseGoing + seatsTaken(requests, { afterId: after.id });
}
function afterSpacesLeft(after, requests) {
  return Math.max(0, after.capacity - afterGoingCount(after, requests));
}
function hostOf(target) {
  return target.kind === 'table' ? target.table.businessId : target.after.hostId;
}
function passCode(sequence) { return 'FNC-' + (4820 + sequence); }

function sendRequest(input, clock) {
  const { guestId, partySize, target, existingRequests } = input;
  if (!isValidPartySize(partySize)) return failR('invalid_party_size');
  const hostId = hostOf(target);
  if (sameActor(hostId, guestId)) return failR('own_listing');
  const pending = existingRequests.filter((r) => r.guestId === guestId && r.status === 'pending');
  if (!input.guestIsPremium && pending.length >= FREE_PENDING_CAP) return failR('request_cap');
  const duplicate = pending.some((r) =>
    target.kind === 'table' ? r.tableId === target.table.id : r.afterId === target.after.id);
  if (duplicate) return failR('duplicate');
  const now = clock.now();
  return okR({
    request: {
      id: input.newRequestId, kind: target.kind, guestId, hostId, partySize,
      venueId: target.kind === 'table' ? target.table.venueId : null,
      tableId: target.kind === 'table' ? target.table.id : null,
      afterId: target.kind === 'after' ? target.after.id : null,
      status: 'pending', createdAt: now, respondedAt: null,
      declineReason: null, passId: null, threadId: input.newThreadId,
    },
    threadId: input.newThreadId,
  });
}

function acceptRequest(input, clock) {
  const { request, actingAs, target, allRequests } = input;
  if (request.status !== 'pending') return failR('already_resolved');
  if (!sameActor(actingAs, request.hostId)) return failR('not_authorized');
  if (sameActor(request.guestId, request.hostId)) return failR('own_listing');
  const others = allRequests.filter((r) => r.id !== request.id);
  const remaining = target.kind === 'table'
    ? tableSeatsLeft(target.table, others)
    : afterSpacesLeft(target.after, others);
  if (request.partySize > remaining) return failR('at_capacity');
  const now = clock.now();
  const pass = (request.kind === 'table' && request.venueId) ? {
    id: input.newPassId, requestId: request.id, guestId: request.guestId,
    partySize: request.partySize, venueId: request.venueId, tableId: request.tableId,
    code: passCode(input.passSequence), issuedAt: now, status: 'active', rated: false,
  } : null;
  return okR({
    request: { ...request, status: 'accepted', respondedAt: now, passId: pass ? pass.id : null },
    pass,
    revealedAddress: target.kind === 'after' ? target.after.address : null,
    incrementNightsFor: request.guestId,
  });
}

function declineRequest(request, actingAs, reason, clock) {
  if (request.status !== 'pending') return failR('already_resolved');
  if (!sameActor(actingAs, request.hostId)) return failR('not_authorized');
  return okR({ ...request, status: 'declined', respondedAt: clock.now(), declineReason: reason });
}
function cancelRequest(request, actingAs, clock) {
  if (request.status !== 'pending') return failR('already_resolved');
  if (!sameActor(actingAs, request.guestId)) return failR('not_authorized');
  return okR({ ...request, status: 'cancelled', respondedAt: clock.now() });
}
function canSeeAfterAddress(after, viewer, requests) {
  if (after.hostId === viewer) return true;
  return requests.some((r) => r.afterId === after.id && r.guestId === viewer && r.status === 'accepted');
}

/* ===== transcribed from src/domain/accounts.ts ============================ */

const MINIMUM_AGE = 18;

function ageInYears(dateOfBirth, at) {
  if (!dateOfBirth) return null;
  const born = Date.parse(dateOfBirth);
  if (Number.isNaN(born)) return null;
  if (born > at) return null;
  const b = new Date(born), n = new Date(at);
  let age = n.getUTCFullYear() - b.getUTCFullYear();
  const beforeBirthday = n.getUTCMonth() < b.getUTCMonth() ||
    (n.getUTCMonth() === b.getUTCMonth() && n.getUTCDate() < b.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}
function meetsMinimumAge(dateOfBirth, at) {
  const age = ageInYears(dateOfBirth, at);
  return age !== null && age >= MINIMUM_AGE;
}
function resolveVerification(account, evidence, clock) {
  if (account.verification.status !== 'pending') return account;
  const now = clock.now();
  const settle = (status, rejectionReason) => ({
    ...account,
    verification: { ...account.verification, status, resolvedAt: now, rejectionReason },
  });
  if (!evidence.documentReadable) return settle('rejected', 'unreadable_document');
  if (account.role === 'business') return settle('verified', null);
  const dob = evidence.documentDateOfBirth;
  if (dob === null || ageInYears(dob, now) === null) return settle('rejected', 'age_indeterminate');
  if (!meetsMinimumAge(dob, now)) return settle('rejected', 'under_age');
  return settle('verified', null);
}
function canEnter(account) { return account.verification.status === 'verified'; }
function mayRetryVerification(account) {
  return account.verification.status === 'rejected' &&
    account.verification.rejectionReason !== 'under_age';
}
function nextStep(account) {
  switch (account.verification.status) {
    case 'unverified': return 'verify';
    case 'pending': return 'awaiting_verification';
    case 'rejected': return mayRetryVerification(account) ? 'verify' : 'blocked';
    case 'verified': break;
  }
  if (!account.profileComplete) return 'profile';
  if (!account.onboardingComplete) return 'onboarding';
  return 'ready';
}

/* ===== transcribed from src/domain/spots.ts =============================== */

function hasVisited(visits, personId, spotId) {
  return visits.some((v) => v.personId === personId && v.spotId === spotId);
}
function visitSpot(spot, personId, visits, clock) {
  if (spot.droppedBy === personId) return { ok: false, error: 'own_spot' };
  if (hasVisited(visits, personId, spot.id)) return { ok: false, error: 'already_visited' };
  return { ok: true, value: { visit: { spotId: spot.id, personId, at: clock.now() }, tokenTo: spot.droppedBy } };
}
function tokensForSpot(spotId, visits) {
  return new Set(visits.filter((v) => v.spotId === spotId).map((v) => v.personId)).size;
}

/* ===== transcribed from src/domain/stories.ts ============================= */

const CHECKIN_TTL_MS = 3 * 60 * 60 * 1000;
const STORY_TTL_MS = 6 * 60 * 60 * 1000;
const VENUE_GEOFENCE_METRES = 75;
const EARTH_RADIUS_M = 6371008.8;
const toRad = (deg) => (deg * Math.PI) / 180;

function distanceMetres(a, b) {
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function isWithin(centre, point, radiusMetres) {
  return distanceMetres(centre, point) <= radiusMetres;
}
function checkIn(personId, venue, deviceAt, clock) {
  if (!deviceAt || !isWithin(venue.at, deviceAt, VENUE_GEOFENCE_METRES)) {
    return { ok: false, error: 'too_far' };
  }
  const now = clock.now();
  return { ok: true, value: { personId, venueId: venue.id, at: now, expiresAt: now + CHECKIN_TTL_MS } };
}
function postStory(input, clock) {
  const now = clock.now();
  const live = input.checkIn && input.checkIn.expiresAt > now ? input.checkIn : null;
  return {
    id: input.id, by: input.by, venueId: live ? live.venueId : null,
    postedAt: now, verifiedAtVenue: live !== null, gradient: input.gradient,
  };
}
function storyExpired(story, now) { return now - story.postedAt >= STORY_TTL_MS; }

/* ===== test harness ======================================================= */

const results = [];
function check(name, actual, expected) {
  results.push({ name, pass: JSON.stringify(actual) === JSON.stringify(expected), actual, expected });
}

const NOW = Date.parse('2026-08-09T12:00:00Z');
const clock = { now: () => NOW, timeZone: () => 'UTC' };

const TABLE = { id: 't1', venueId: 'monarch', businessId: 'biz', name: 'Booth 5', seats: 6 };
const AFTER = { id: 'a1', hostId: 'kit', capacity: 20, baseGoing: 14, address: '1180 Rhode Island St' };
const tableTarget = { kind: 'table', table: TABLE };
const afterTarget = { kind: 'after', after: AFTER };

let n = 0;
const req = (over) => ({
  id: 'r' + (++n), kind: 'table', guestId: 'guest', hostId: 'biz', partySize: 2,
  venueId: 'monarch', tableId: 't1', afterId: null, status: 'accepted',
  createdAt: NOW, respondedAt: NOW, declineReason: null, passId: null, threadId: null, ...over,
});
const send = (over = {}) => sendRequest({
  guestId: 'guest', partySize: 2, target: tableTarget, existingRequests: [],
  guestIsPremium: false, newRequestId: 'new', newThreadId: 'th', ...over,
}, clock);

// --- party size ---------------------------------------------------------
check('party size 1..6 valid', [1,2,3,4,5,6].every(isValidPartySize), true);
check('party size 0/-1/7/2.5/NaN invalid', [0,-1,7,2.5,NaN].some(isValidPartySize), false);
check('send refuses party size 0', send({ partySize: 0 }).error, 'invalid_party_size');

// --- self-listing --------------------------------------------------------
check('cannot request own listing', send({ guestId: 'biz' }).error, 'own_listing');
const selfReq = req({ guestId: 'biz', status: 'pending' });
check('cannot accept own listing (legacy row in storage)',
  acceptRequest({ request: selfReq, actingAs: 'biz', target: tableTarget, allRequests: [selfReq], newPassId: 'p', passSequence: 0 }, clock).error,
  'own_listing');

// --- caps and duplicates --------------------------------------------------
const pend = (k) => Array.from({ length: k }, (_, i) => req({ status: 'pending', tableId: 'other' + i }));
check('free account capped at 3 pending', send({ existingRequests: pend(3) }).error, 'request_cap');
check('premium bypasses the cap', send({ existingRequests: pend(3), guestIsPremium: true }).ok, true);
check('resolved requests do not count toward the cap',
  send({ existingRequests: pend(3).map((r) => ({ ...r, status: 'declined' })) }).ok, true);
check('duplicate pending for same table blocked',
  send({ existingRequests: [req({ status: 'pending', tableId: 't1' })] }).error, 'duplicate');
check('different table allowed',
  send({ existingRequests: [req({ status: 'pending', tableId: 'elsewhere' })] }).ok, true);

// --- capacity counts people, not requests ---------------------------------
check('6-seat table, one party of 4 accepted -> 2 left', tableSeatsLeft(TABLE, [req({ partySize: 4 })]), 2);
check('two parties of 1 -> 4 left', tableSeatsLeft(TABLE, [req({ partySize: 1 }), req({ partySize: 1 })]), 4);
check('never negative', tableSeatsLeft(TABLE, [req({ partySize: 6 }), req({ partySize: 4 })]), 0);
const big = req({ partySize: 4, status: 'pending' });
check('party of 4 refused when only 2 seats remain',
  acceptRequest({ request: big, actingAs: 'biz', target: tableTarget, allRequests: [big, req({ partySize: 4 })], newPassId: 'p', passSequence: 0 }, clock).error,
  'at_capacity');
const exact = req({ partySize: 2, status: 'pending' });
check('party that exactly fills the table is accepted',
  acceptRequest({ request: exact, actingAs: 'biz', target: tableTarget, allRequests: [exact, req({ partySize: 4 })], newPassId: 'p', passSequence: 0 }, clock).ok,
  true);
check('after-party headcount includes its base going', afterGoingCount(AFTER, [req({ partySize: 3, afterId: 'a1', tableId: null })]), 17);

// --- accept outcomes -------------------------------------------------------
const pending = req({ status: 'pending' });
const acc = acceptRequest({ request: pending, actingAs: 'biz', target: tableTarget, allRequests: [pending], newPassId: 'p1', passSequence: 0 }, clock);
check('accept issues a pass with a code', acc.value.pass.code, 'FNC-4820');
check('accept advances the guest night count', acc.value.incrementNightsFor, 'guest');
check('a table accept reveals no address', acc.value.revealedAddress, null);
const ask = req({ kind: 'after', hostId: 'kit', afterId: 'a1', tableId: null, venueId: null, status: 'pending' });
const accAfter = acceptRequest({ request: ask, actingAs: 'kit', target: afterTarget, allRequests: [ask], newPassId: 'p2', passSequence: 1 }, clock);
check('an after accept issues no pass', accAfter.value.pass, null);
check('an after accept reveals the address', accAfter.value.revealedAddress, AFTER.address);
check('cannot resolve twice',
  acceptRequest({ request: req({ status: 'accepted' }), actingAs: 'biz', target: tableTarget, allRequests: [], newPassId: 'p', passSequence: 0 }, clock).error,
  'already_resolved');

// --- authorisation ----------------------------------------------------------
check('a stranger cannot accept',
  acceptRequest({ request: pending, actingAs: 'nobody', target: tableTarget, allRequests: [pending], newPassId: 'p', passSequence: 0 }, clock).error,
  'not_authorized');
check('the guest cannot decline', declineRequest(pending, 'guest', 'no', clock).error, 'not_authorized');
check('the host can decline', declineRequest(pending, 'biz', 'full', clock).value.declineReason, 'full');
check('the host cannot cancel', cancelRequest(pending, 'biz', clock).error, 'not_authorized');
check('the guest can cancel', cancelRequest(pending, 'guest', clock).value.status, 'cancelled');

// --- address reveal ---------------------------------------------------------
const afterReq = (status, guestId = 'guest') => req({ kind: 'after', guestId, hostId: 'kit', afterId: 'a1', tableId: null, status });
check('address hidden with no request', canSeeAfterAddress(AFTER, 'guest', []), false);
check('address hidden while pending', canSeeAfterAddress(AFTER, 'guest', [afterReq('pending')]), false);
check('address hidden after decline', canSeeAfterAddress(AFTER, 'guest', [afterReq('declined')]), false);
check('address shown once accepted', canSeeAfterAddress(AFTER, 'guest', [afterReq('accepted')]), true);
check('address always shown to the host', canSeeAfterAddress(AFTER, 'kit', []), true);
check('address not leaked to another accepted guest',
  canSeeAfterAddress(AFTER, 'guest', [afterReq('accepted', 'someone-else')]), false);

// --- 18+ gate ---------------------------------------------------------------
check('age counted on the real calendar', ageInYears('2000-08-09', NOW), 26);
check('birthday not yet reached', ageInYears('2000-08-10', NOW), 25);
check('does not turn 18 a day early', meetsMinimumAge('2008-08-10', NOW), false);
check('turns 18 exactly on the birthday', meetsMinimumAge('2008-08-09', NOW), true);
check('every uncertain dob fails closed',
  [null, '', 'not a date', '2030-01-01'].some((d) => meetsMinimumAge(d, NOW)), false);

const acct = (role, over = {}) => ({
  role, verification: { status: 'pending', method: 'id_upload', submittedAt: NOW, resolvedAt: null, rejectionReason: null },
  profileComplete: false, onboardingComplete: false, ...over,
});
check('unreadable document rejected',
  resolveVerification(acct('consumer'), { documentReadable: false, documentDateOfBirth: null }, clock).verification.rejectionReason,
  'unreadable_document');
check('indeterminable age rejected',
  resolveVerification(acct('consumer'), { documentReadable: true, documentDateOfBirth: null }, clock).verification.rejectionReason,
  'age_indeterminate');
check('under-age document rejected even if signup claimed adult',
  resolveVerification(acct('consumer'), { documentReadable: true, documentDateOfBirth: '2012-01-01' }, clock).verification.rejectionReason,
  'under_age');
check('adult verified',
  resolveVerification(acct('consumer'), { documentReadable: true, documentDateOfBirth: '1995-01-01' }, clock).verification.status,
  'verified');
check('business verified with no age check',
  resolveVerification(acct('business'), { documentReadable: true, documentDateOfBirth: null }, clock).verification.status,
  'verified');
const underAge = resolveVerification(acct('consumer'), { documentReadable: true, documentDateOfBirth: '2012-01-01' }, clock);
check('under-age rejection is terminal', mayRetryVerification(underAge), false);
check('under-age account is blocked, not routed to retry', nextStep(underAge), 'blocked');
check('under-age account cannot enter', canEnter(underAge), false);
const badScan = resolveVerification(acct('consumer'), { documentReadable: false, documentDateOfBirth: null }, clock);
check('a bad scan may retry', nextStep(badScan), 'verify');
check('verification comes before profile',
  nextStep(resolveVerification(acct('consumer'), { documentReadable: true, documentDateOfBirth: '1995-01-01' }, clock)),
  'profile');

// --- spots -------------------------------------------------------------------
const SPOT = { id: 's1', droppedBy: 'maya' };
check('cannot earn a token from your own spot', visitSpot(SPOT, 'maya', [], clock).error, 'own_spot');
check('first visit counts', visitSpot(SPOT, 'theo', [], clock).ok, true);
check('second visit by the same person does not',
  visitSpot(SPOT, 'theo', [{ spotId: 's1', personId: 'theo', at: NOW }], clock).error, 'already_visited');
check('tokens count distinct visitors',
  tokensForSpot('s1', [
    { spotId: 's1', personId: 'theo', at: NOW },
    { spotId: 's1', personId: 'theo', at: NOW },
    { spotId: 's1', personId: 'sana', at: NOW },
    { spotId: 's2', personId: 'nia', at: NOW },
  ]), 2);

// --- stories -------------------------------------------------------------------
const VENUE_AT = { id: 'monarch', at: { lat: 37.7797, lon: -122.4090 } };
const INSIDE = { lat: 37.77972, lon: -122.40903 };          // a few metres away
const OUTSIDE = { lat: 37.7830, lon: -122.4090 };            // ~370m up the road
check('check-in works from inside the fence', checkIn('me', VENUE_AT, INSIDE, clock).ok, true);
check('check-in refused from across the street', checkIn('me', VENUE_AT, OUTSIDE, clock).error, 'too_far');
check('check-in refused with no location at all', checkIn('me', VENUE_AT, null, clock).error, 'too_far');

const liveCheckIn = { personId: 'me', venueId: 'monarch', at: NOW, expiresAt: NOW + CHECKIN_TTL_MS };
const deadCheckIn = { personId: 'me', venueId: 'monarch', at: NOW - 1, expiresAt: NOW - 1 };
check('story from inside carries the verified mark',
  postStory({ id: 'st1', by: 'me', gradient: ['#0', '#1'], checkIn: liveCheckIn }, clock).verifiedAtVenue, true);
check('story from inside attaches to the venue',
  postStory({ id: 'st1', by: 'me', gradient: ['#0', '#1'], checkIn: liveCheckIn }, clock).venueId, 'monarch');
check('story with no check-in is unverified',
  postStory({ id: 'st2', by: 'me', gradient: ['#0', '#1'], checkIn: null }, clock).verifiedAtVenue, false);
check('check-in that lapsed while the composer was open does not verify',
  postStory({ id: 'st3', by: 'me', gradient: ['#0', '#1'], checkIn: deadCheckIn }, clock).verifiedAtVenue, false);
check('a fresh story is live', storyExpired({ postedAt: NOW - 60_000 }, NOW), false);
check('a story older than six hours has gone', storyExpired({ postedAt: NOW - STORY_TTL_MS }, NOW), true);

/* ===== report ============================================================= */

const failed = results.filter((r) => !r.pass);
window.__DOMAIN_RESULT__ = {
  total: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  failures: failed,
};

})();
