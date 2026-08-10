/**
 * Commands.
 *
 * Each one runs a domain function, and only writes if the domain said yes.
 * Screens get the result and render the refusal reason — no screen is
 * permitted to decide whether something is allowed.
 */

import {
  acceptRequest as acceptRequestRule,
  cancelRequest as cancelRequestRule,
  checkIn as checkInRule,
  closeThread,
  declineRequest as declineRequestRule,
  dropSpot as dropSpotRule,
  expressInterest as expressInterestRule,
  goCasual,
  goDtf,
  goOff,
  passCode,
  postStory as postStoryRule,
  postTable as postTableRule,
  rateNight as rateNightRule,
  saveItem as saveItemRule,
  sendMessage as sendMessageRule,
  sendRequest as sendRequestRule,
  SYSTEM,
  threadForRequest,
  unsaveItem as unsaveItemRule,
  visitSpot as visitSpotRule,
  withExpiry,
  type AccessError,
  type AccessRequest,
  type AfterParty,
  type Coordinates,
  type PersonId,
  type SavedKind,
  type SpotId,
  type TableOffer,
  type ThreadId,
  type VenueId,
} from '../../domain';
import { asMessageId, asPassId, asRequestId, asSpotId, asStoryId, asTableId, asThreadId } from '../../domain/ids';
import { heatFor } from '../../data/schema';
import { addFriendship, removeFriendship } from '../../data/graph';
import { buildDemoWorld } from '../../data/seed/demo-world';
import type { AppContextValue } from './AppProvider';
import { presenceOf } from './selectors';

/**
 * Ids.
 *
 * `Math.random` is fine for a local prototype id and nothing here depends on
 * it being unguessable — a pass code is validated against the store, not
 * trusted because it was hard to guess.
 */
let counter = 0;
const uid = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export type ActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

const OK: ActionResult = { ok: true };

/** Refusal reasons, in words a person can act on. */
export function explain(error: AccessError | string): string {
  switch (error) {
    case 'request_cap':
      return 'You have three requests still out. Wait on one, or go Disco for unlimited.';
    case 'duplicate':
      return 'Already sent — it is in your Plans.';
    case 'own_listing':
      return 'This is yours. Nothing to request.';
    case 'at_capacity':
      return 'Not enough room left for your party.';
    case 'invalid_party_size':
      return 'Party size has to be between 1 and 6.';
    case 'not_authorized':
      return 'That is not yours to decide.';
    case 'already_resolved':
      return 'That has already been answered.';
    case 'not_your_venue':
      return 'You do not run that venue.';
    case 'already_claimed':
      return 'Another business already runs that venue.';
    case 'not_verified':
      return 'Verify the business before claiming a venue.';
    case 'too_far':
      return 'You need to actually be there to check in.';
    case 'own_spot':
      return 'You cannot collect a token from your own spot.';
    case 'already_visited':
      return 'Already counted — one token per person per spot.';
    case 'thread_closed':
      return 'This one is closed.';
    default:
      return 'That did not work.';
  }
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

/**
 * Sign out this device.
 *
 * Clears only the session pointer — never a captured id — so there is no
 * closure to go stale and no way this can end up signing out an account
 * other than whichever one is actually signed in when it runs.
 */
export function logout(app: AppContextValue): void {
  app.update((state) => {
    state.session.personId = null;
  });
}

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------

export function setDtf(app: AppContextValue): void {
  const me = app.meId;
  if (!me) return;
  const presence = goDtf(app.clock);
  app.update((state) => {
    state.presence[me as string] = {
      presence,
      shareWithMutuals: presenceOf(state, me as string).shareWithMutuals,
    };
  });
}

export function setCasual(app: AppContextValue): void {
  const me = app.meId;
  if (!me) return;
  const presence = goCasual(app.clock);
  app.update((state) => {
    state.presence[me as string] = {
      presence,
      shareWithMutuals: presenceOf(state, me as string).shareWithMutuals,
    };
  });
}

export function setOff(app: AppContextValue): void {
  const me = app.meId;
  if (!me) return;
  app.update((state) => {
    state.presence[me as string] = {
      presence: goOff(),
      shareWithMutuals: presenceOf(state, me as string).shareWithMutuals,
    };
  });
}

/** Move when presence lapses. Setting it to the past ends it now. */
export function adjustExpiry(app: AppContextValue, expiresAt: number): void {
  const me = app.meId;
  if (!me) return;
  app.update((state) => {
    const current = presenceOf(state, me as string);
    state.presence[me as string] = {
      presence: withExpiry(current.presence, expiresAt, app.clock.now()),
      shareWithMutuals: current.shareWithMutuals,
    };
  });
}

/** The permanent setting. Never expires; grants nothing without DTF. */
export function setShareWithMutuals(app: AppContextValue, on: boolean): void {
  const me = app.meId;
  if (!me) return;
  app.update((state) => {
    state.presence[me as string] = {
      presence: presenceOf(state, me as string).presence,
      shareWithMutuals: on,
    };
  });
}

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

export function requestTable(
  app: AppContextValue,
  table: TableOffer,
  partySize: number,
): ActionResult {
  const me = app.meId;
  if (!me) return { ok: false, reason: 'Sign in first.' };

  const threadId = asThreadId(uid('th'));
  const result = sendRequestRule(
    {
      guestId: me,
      partySize,
      target: { kind: 'table', table },
      existingRequests: app.state.requests,
      guestIsPremium: app.state.accounts[me as string]?.premium === true,
      newRequestId: asRequestId(uid('req')),
      newThreadId: threadId,
    },
    app.clock,
  );
  if (!result.ok) return { ok: false, reason: explain(result.error) };

  const { request } = result.value;
  app.update((state) => {
    state.requests.push(request);
    state.threads.push(threadForRequest(threadId, request.id, me, request.hostId, app.clock));
  });
  return OK;
}

export function askAfterParty(
  app: AppContextValue,
  after: AfterParty,
  partySize: number,
): ActionResult {
  const me = app.meId;
  if (!me) return { ok: false, reason: 'Sign in first.' };

  const threadId = asThreadId(uid('th'));
  const result = sendRequestRule(
    {
      guestId: me,
      partySize,
      target: { kind: 'after', after },
      existingRequests: app.state.requests,
      guestIsPremium: app.state.accounts[me as string]?.premium === true,
      newRequestId: asRequestId(uid('req')),
      newThreadId: threadId,
    },
    app.clock,
  );
  if (!result.ok) return { ok: false, reason: explain(result.error) };

  const { request } = result.value;
  app.update((state) => {
    state.requests.push(request);
    state.threads.push(threadForRequest(threadId, request.id, me, request.hostId, app.clock));
  });
  return OK;
}

function targetFor(app: AppContextValue, request: AccessRequest) {
  if (request.kind === 'after') {
    const after = app.state.afterParties.find((a) => a.id === request.afterId);
    return after ? ({ kind: 'after', after } as const) : null;
  }
  const table = app.state.tables.find((t) => t.id === request.tableId);
  return table ? ({ kind: 'table', table } as const) : null;
}

export function acceptRequest(app: AppContextValue, request: AccessRequest): ActionResult {
  const me = app.meId;
  if (!me) return { ok: false, reason: 'Sign in first.' };
  const target = targetFor(app, request);
  if (!target) return { ok: false, reason: 'That listing has gone.' };

  const result = acceptRequestRule(
    {
      request,
      actingAs: me,
      target,
      allRequests: app.state.requests,
      newPassId: asPassId(uid('pass')),
      passSequence: app.state.passes.length,
    },
    app.clock,
  );
  if (!result.ok) return { ok: false, reason: explain(result.error) };

  const { request: updated, pass, incrementNightsFor } = result.value;
  app.update((state) => {
    const index = state.requests.findIndex((r) => r.id === request.id);
    if (index >= 0) state.requests[index] = updated;
    if (pass) state.passes.push(pass);

    const profile = state.profiles[incrementNightsFor as string];
    if (profile) {
      state.profiles[incrementNightsFor as string] = {
        ...profile,
        nightsOut: profile.nightsOut + 1,
      };
    }

    const thread = state.threads.find((t) => t.id === request.threadId);
    if (thread) {
      const message = sendMessageRule(
        {
          id: asMessageId(uid('msg')),
          thread,
          sender: { kind: 'system' },
          body: `${nameFor(state, request.hostId as string)} accepted`,
        },
        app.clock,
      );
      if (message.ok) state.messages.push(message.value.message);
    }
  });

  void app.notifications.present({
    kind: 'request_accepted',
    requestId: request.id,
    passId: pass ? pass.id : null,
    hostName: nameFor(app.state, request.hostId as string),
  });

  return OK;
}

export function declineRequest(
  app: AppContextValue,
  request: AccessRequest,
  reason: string | null,
): ActionResult {
  const me = app.meId;
  if (!me) return { ok: false, reason: 'Sign in first.' };
  const result = declineRequestRule(request, me, reason, app.clock);
  if (!result.ok) return { ok: false, reason: explain(result.error) };

  app.update((state) => {
    const index = state.requests.findIndex((r) => r.id === request.id);
    if (index >= 0) state.requests[index] = result.value;
    const threadIndex = state.threads.findIndex((t) => t.id === request.threadId);
    const thread = state.threads[threadIndex];
    if (thread) {
      const closed = closeThread(thread);
      const suffix = reason ? ` — ${reason}` : '';
      const message = sendMessageRule(
        {
          id: asMessageId(uid('msg')),
          thread: closed,
          sender: SYSTEM,
          body: `${nameFor(state, request.hostId as string)} declined${suffix}`,
        },
        app.clock,
      );
      state.threads[threadIndex] = message.ok ? message.value.thread : closed;
      if (message.ok) state.messages.push(message.value.message);
    }
  });
  return OK;
}

export function cancelRequest(app: AppContextValue, request: AccessRequest): ActionResult {
  const me = app.meId;
  if (!me) return { ok: false, reason: 'Sign in first.' };
  const result = cancelRequestRule(request, me, app.clock);
  if (!result.ok) return { ok: false, reason: explain(result.error) };

  app.update((state) => {
    const index = state.requests.findIndex((r) => r.id === request.id);
    if (index >= 0) state.requests[index] = result.value;
    const threadIndex = state.threads.findIndex((t) => t.id === request.threadId);
    const thread = state.threads[threadIndex];
    if (thread) {
      const closed = closeThread(thread);
      const message = sendMessageRule(
        {
          id: asMessageId(uid('msg')),
          thread: closed,
          sender: SYSTEM,
          body: `${nameFor(state, request.guestId as string)} cancelled`,
        },
        app.clock,
      );
      state.threads[threadIndex] = message.ok ? message.value.thread : closed;
      if (message.ok) state.messages.push(message.value.message);
    }
  });
  return OK;
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

export function sendMessage(app: AppContextValue, threadId: ThreadId, body: string): ActionResult {
  const me = app.meId;
  if (!me) return { ok: false, reason: 'Sign in first.' };
  const thread = app.state.threads.find((t) => t.id === threadId);
  if (!thread) return { ok: false, reason: 'That conversation has gone.' };

  const result = sendMessageRule(
    { id: asMessageId(uid('msg')), thread, sender: { kind: 'actor', id: me }, body },
    app.clock,
  );
  if (!result.ok) return { ok: false, reason: explain(result.error) };

  app.update((state) => {
    state.messages.push(result.value.message);
    const index = state.threads.findIndex((t) => t.id === threadId);
    if (index >= 0) state.threads[index] = result.value.thread;
  });
  return OK;
}

// ---------------------------------------------------------------------------
// Places and content
// ---------------------------------------------------------------------------

export function checkInAt(app: AppContextValue, venueId: VenueId): ActionResult {
  const me = app.meId;
  if (!me) return { ok: false, reason: 'Sign in first.' };
  const venue = app.places.venueByIdSync(venueId);
  if (!venue) return { ok: false, reason: 'Unknown venue.' };

  const fix = app.fixes[me as string] ?? null;
  const result = checkInRule(me, { id: venue.id, at: venue.at }, fix ? fix.at : null, app.clock);
  if (!result.ok) return { ok: false, reason: explain(result.error) };

  app.update((state) => {
    state.checkIns.push(result.value);
  });
  return OK;
}

export function postStory(app: AppContextValue, gradient: readonly [string, string]): ActionResult {
  const me = app.meId;
  if (!me) return { ok: false, reason: 'Sign in first.' };

  // Re-read the check-in now, not when the composer opened — it can lapse
  // while the sheet is sitting there.
  const live =
    app.state.checkIns
      .filter((c) => c.personId === me && c.expiresAt > app.clock.now())
      .sort((a, b) => b.at - a.at)[0] ?? null;

  const story = postStoryRule({ id: asStoryId(uid('st')), by: me, gradient, checkIn: live }, app.clock);
  app.update((state) => {
    state.stories.push(story);
  });
  return story.verifiedAtVenue
    ? OK
    : { ok: false, reason: 'Posted, but not from inside anywhere — no verified mark.' };
}

export function dropSpot(
  app: AppContextValue,
  name: string,
  note: string,
  at: Coordinates,
): ActionResult {
  const me = app.meId;
  if (!me) return { ok: false, reason: 'Sign in first.' };
  const result = dropSpotRule({ id: asSpotId(uid('spot')), name, note, at, droppedBy: me }, app.clock);
  if (!result.ok) return { ok: false, reason: 'Give it a name first.' };

  app.update((state) => {
    state.spots.push(result.value);
    const profile = state.profiles[me as string];
    if (profile) {
      state.profiles[me as string] = { ...profile, spotsDropped: profile.spotsDropped + 1 };
    }
  });
  return OK;
}

export function visitSpot(app: AppContextValue, spotId: SpotId): ActionResult {
  const me = app.meId;
  if (!me) return { ok: false, reason: 'Sign in first.' };
  const spot = app.state.spots.find((s) => s.id === spotId);
  if (!spot) return { ok: false, reason: 'That spot has gone.' };

  const result = visitSpotRule(spot, me, app.state.visits, app.clock);
  if (!result.ok) return { ok: false, reason: explain(result.error) };

  app.update((state) => {
    state.visits.push(result.value.visit);
    const index = state.spots.findIndex((s) => s.id === spotId);
    const current = state.spots[index];
    if (current) state.spots[index] = { ...current, tokens: current.tokens + 1 };

    const owner = state.profiles[spot.droppedBy as string];
    if (owner) {
      state.profiles[spot.droppedBy as string] = { ...owner, tokens: owner.tokens + 1 };
    }
  });
  return OK;
}

// ---------------------------------------------------------------------------
// Engagement
// ---------------------------------------------------------------------------

export function rateNight(app: AppContextValue, stars: number): ActionResult {
  const me = app.meId;
  if (!me) return { ok: false, reason: 'Sign in first.' };
  const pass = app.state.passes
    .filter((p) => p.guestId === me)
    .sort((a, b) => b.issuedAt - a.issuedAt)[0];
  if (!pass) return { ok: false, reason: 'Nothing to rate yet.' };

  const result = rateNightRule(pass, stars, heatFor(app.state, pass.venueId, 0.3));
  if (!result.ok) return { ok: false, reason: 'Pick a rating first.' };

  app.update((state) => {
    state.venueHeat[result.value.venueId as string] = result.value.newHeat;
    const index = state.passes.findIndex((p) => p.id === pass.id);
    if (index >= 0) state.passes[index] = result.value.pass;
  });
  return OK;
}

export function toggleSaved(
  app: AppContextValue,
  kind: SavedKind,
  refId: VenueId | SpotId,
): ActionResult {
  const me = app.meId;
  if (!me) return { ok: false, reason: 'Sign in first.' };
  const already = app.state.saved.some(
    (s) => s.personId === me && s.kind === kind && (s.refId as string) === (refId as string),
  );
  app.update((state) => {
    state.saved = [
      ...(already
        ? unsaveItemRule(state.saved, me, kind, refId)
        : saveItemRule(state.saved, me, kind, refId, app.clock)),
    ];
  });
  return OK;
}

export function expressInterest(app: AppContextValue, toId: PersonId): ActionResult {
  const me = app.meId;
  if (!me) return { ok: false, reason: 'Sign in first.' };
  app.update((state) => {
    state.interest = [...expressInterestRule(state.interest, me, toId, app.clock)];
  });
  return OK;
}

// ---------------------------------------------------------------------------
// Relationships
// ---------------------------------------------------------------------------

export function addFriend(app: AppContextValue, personId: PersonId): void {
  const me = app.meId;
  if (!me) return;
  app.update((state) => {
    state.friendships = [...addFriendship(state.friendships, me, personId, app.clock.now())];
  });
}

export function removeFriend(app: AppContextValue, personId: PersonId): void {
  const me = app.meId;
  if (!me) return;
  app.update((state) => {
    state.friendships = [...removeFriendship(state.friendships, me, personId)];
  });
}

// ---------------------------------------------------------------------------
// Business
// ---------------------------------------------------------------------------

export function postTable(
  app: AppContextValue,
  venueId: VenueId,
  name: string,
  seats: number,
  perHeadMajorUnits: number,
  vibe: string,
): ActionResult {
  const me = app.meId;
  if (!me) return { ok: false, reason: 'Sign in first.' };
  const business = app.state.businesses[me as string];
  if (!business) return { ok: false, reason: 'Not a business account.' };

  const result = postTableRule({
    id: asTableId(uid('t')),
    business,
    venueId,
    name,
    seats,
    perHeadMajorUnits,
    currency: 'USD',
    vibe,
  });
  if (!result.ok) return { ok: false, reason: explain(result.error) };

  app.update((state) => {
    state.tables.push(result.value);
  });
  return OK;
}

function nameFor(state: { profiles: Record<string, { name: string }>; businesses: Record<string, { name: string }> }, id: string): string {
  return state.profiles[id]?.name ?? state.businesses[id]?.name ?? 'Someone';
}

/**
 * Reset this device back to the demo world.
 *
 * A development affordance, kept because reproducing a state by hand is how
 * verification gets skipped. It replaces app state wholesale; the quarantine
 * key and any imported legacy blob are untouched.
 */
export function resetDemoWorld(app: AppContextValue): void {
  const demo = buildDemoWorld(app.clock.now(), app.clock.timeZone());
  app.update(() => demo.state);
}

export { passCode };
