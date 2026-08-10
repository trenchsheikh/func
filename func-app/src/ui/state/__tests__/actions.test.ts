/**
 * The wrapper functions in actions.ts had zero coverage before this file —
 * which is exactly how a critical authorization bug (acceptRequest/
 * declineRequest passing request.hostId as the acting user instead of the
 * signed-in one) shipped past the domain layer's own, correctly-written
 * guards. These tests exercise the wrappers themselves, not the domain rules
 * they call.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fixedClock } from '../../../domain/clock';
import { asAfterPartyId, asPersonId } from '../../../domain/ids';
import type { AfterParty } from '../../../domain/access';
import { emptyState, type PersistedState } from '../../../data/schema';
import { socialGraph } from '../../../data/graph';
import { InMemoryPlaceRepository } from '../../../data/places';
import { FakeLocationService } from '../../../services/location';
import { FakeNotificationService } from '../../../services/notifications';
import type { AppContextValue } from '../AppProvider';
import { acceptRequest, askAfterParty, cancelRequest, declineRequest } from '../actions';

const NOW = Date.parse('2026-08-09T12:00:00Z');

/** A fresh, in-memory stand-in for the store, shared across "devices" so
 * actions from different acting users see the same underlying state — the
 * same way requests actually cross between a guest's phone and a host's. */
function testWorld() {
  const box: { state: PersistedState } = { state: emptyState() };
  const places = new InMemoryPlaceRepository({ cities: [], districts: [], venues: [] });

  const contextFor = (meId: string | null): AppContextValue => ({
    ready: true,
    loadOutcome: null,
    writeError: null,
    get state() {
      return box.state;
    },
    meId: meId === null ? null : asPersonId(meId),
    fixes: {},
    graph: socialGraph(box.state.friendships),
    clock: fixedClock(NOW),
    location: new FakeLocationService('undetermined'),
    notifications: new FakeNotificationService('granted'),
    places,
    update: (fn) => {
      const result = fn(box.state);
      if (result) box.state = result;
    },
    setFix: () => {},
    reload: async () => {},
  });

  return { box, contextFor };
}

const HOST = 'host';
const GUEST = 'guest';
const ATTACKER = 'attacker';

function seedAfterPartyRequest(box: { state: PersistedState }, contextFor: (id: string) => AppContextValue) {
  const after: AfterParty = {
    id: asAfterPartyId('ap1'),
    hostId: asPersonId(HOST),
    area: 'SoMa',
    capacity: 30,
    baseGoing: 27,
    vibe: ['warehouse', 'techno', 'late'],
    address: '123 Real St',
    note: '',
  };
  box.state = { ...box.state, afterParties: [after] };

  const result = askAfterParty(contextFor(GUEST), after, 2);
  assert.equal(result.ok, true, 'setup: sending the request should succeed');
  const request = box.state.requests[0];
  if (!request) throw new Error('setup failed: no request created');
  return request;
}

describe('acceptRequest is only authorized for the actual host', () => {
  it('refuses an unrelated signed-in user, and does not mutate the request', () => {
    const { box, contextFor } = testWorld();
    const request = seedAfterPartyRequest(box, contextFor);

    const result = acceptRequest(contextFor(ATTACKER), request);

    assert.equal(result.ok, false, 'an unrelated user must not be able to accept');
    assert.equal(box.state.requests[0]?.status, 'pending');
    assert.equal(box.state.passes.length, 0);
  });

  it('accepts for the real host', () => {
    const { box, contextFor } = testWorld();
    const request = seedAfterPartyRequest(box, contextFor);

    const result = acceptRequest(contextFor(HOST), request);

    assert.equal(result.ok, true);
    assert.equal(box.state.requests[0]?.status, 'accepted');
  });
});

describe('declineRequest is only authorized for the actual host', () => {
  it('refuses an unrelated signed-in user, and does not close the thread', () => {
    const { box, contextFor } = testWorld();
    const request = seedAfterPartyRequest(box, contextFor);

    const result = declineRequest(contextFor(ATTACKER), request, 'no room');

    assert.equal(result.ok, false, 'an unrelated user must not be able to decline');
    assert.equal(box.state.requests[0]?.status, 'pending');
    const thread = box.state.threads.find((t) => t.id === request.threadId);
    assert.equal(thread?.status, 'open');
  });

  it('refuses when nobody is signed in', () => {
    const { box, contextFor } = testWorld();
    const request = seedAfterPartyRequest(box, contextFor);

    const result = declineRequest(contextFor(null as unknown as string), request, 'no room');

    assert.equal(result.ok, false);
    assert.equal(box.state.requests[0]?.status, 'pending');
  });

  it('declines for the real host and posts a system message as the thread closes', () => {
    const { box, contextFor } = testWorld();
    const request = seedAfterPartyRequest(box, contextFor);

    const result = declineRequest(contextFor(HOST), request, 'no room');

    assert.equal(result.ok, true);
    assert.equal(box.state.requests[0]?.status, 'declined');
    const thread = box.state.threads.find((t) => t.id === request.threadId);
    assert.equal(thread?.status, 'closed');

    const messages = box.state.messages.filter((m) => m.threadId === request.threadId);
    assert.equal(messages.length, 1, 'a system message should explain why the thread closed');
    assert.equal(messages[0]?.sender.kind, 'system');
    assert.match(messages[0]?.body ?? '', /declined/);
    assert.match(messages[0]?.body ?? '', /no room/);
  });
});

describe('cancelRequest posts a system message as the thread closes', () => {
  it('cancels for the guest and explains why in the thread', () => {
    const { box, contextFor } = testWorld();
    const request = seedAfterPartyRequest(box, contextFor);

    const result = cancelRequest(contextFor(GUEST), request);

    assert.equal(result.ok, true);
    assert.equal(box.state.requests[0]?.status, 'cancelled');
    const thread = box.state.threads.find((t) => t.id === request.threadId);
    assert.equal(thread?.status, 'closed');

    const messages = box.state.messages.filter((m) => m.threadId === request.threadId);
    assert.equal(messages.length, 1);
    assert.equal(messages[0]?.sender.kind, 'system');
    assert.match(messages[0]?.body ?? '', /cancelled/);
  });

  it('refuses an unrelated user, matching the guest-only invariant', () => {
    const { box, contextFor } = testWorld();
    const request = seedAfterPartyRequest(box, contextFor);

    const result = cancelRequest(contextFor(ATTACKER), request);

    assert.equal(result.ok, false);
    assert.equal(box.state.requests[0]?.status, 'pending');
  });
});
