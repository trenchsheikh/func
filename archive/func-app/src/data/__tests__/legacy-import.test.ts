import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isDtf, resolvePresence } from '../../domain';
import { importLegacy, looksLikeLegacy } from '../migrations/legacy-prototype';

const NOW = Date.parse('2026-08-09T04:00:00Z');
const HOUR = 60 * 60 * 1000;

/**
 * A legacy root shaped like the real thing.
 *
 * Field names, nesting and types are copied from the frozen prototype's
 * `data/store.js` — `venue` not `venueId` on a table, `by`/`byId` on a spot,
 * `dob` on an account, float dollars for per-head, `'system'` as a sender id.
 * If the fixture drifts from the prototype the test stops meaning anything, so
 * it is written to match `prototype-web-reference`, not to match the importer.
 */
function legacyRoot() {
  return {
    version: 4,
    peopleStatus: {
      you: { status: 'green', statusSetAt: NOW - HOUR, statusExpiresAt: NOW + 4 * HOUR },
      p1: { status: 'amber', statusSetAt: NOW - HOUR, statusExpiresAt: NOW + 2 * HOUR },
      p5: { status: 'red', statusSetAt: NOW - HOUR, statusExpiresAt: null },
      p6: { status: 'disco', statusSetAt: NOW - HOUR, statusExpiresAt: NOW + HOUR },
      lapsed: { status: 'green', statusSetAt: NOW - 9 * HOUR, statusExpiresAt: NOW - HOUR },
    },
    venueHeat: { monarch: 0.83 },
    requests: [
      {
        id: 'req_a', kind: 'table', guestId: 'you', partySize: 4,
        venueId: 'monarch', tableId: 't1', afterId: null, hostId: 'biz-nightform',
        status: 'accepted', createdAt: NOW - HOUR, respondedAt: NOW - HOUR / 2,
        declineReason: null, passId: 'pass_a', threadId: 'th_a',
      },
      // Party size absent — early rows defaulted to one at read time.
      {
        id: 'req_b', kind: 'after', guestId: 'you',
        venueId: null, tableId: null, afterId: 'a1', hostId: 'p6',
        status: 'pending', createdAt: NOW, respondedAt: null,
        declineReason: null, passId: null, threadId: 'th_b',
      },
    ],
    passes: [
      {
        id: 'pass_a', requestId: 'req_a', guestId: 'you', partySize: 4,
        venueId: 'monarch', tableId: 't1', code: 'FNC-4820',
        issuedAt: NOW - HOUR / 2, status: 'active', rated: false,
      },
      // No venue — cannot be shown on a door or rated.
      { id: 'pass_orphan', requestId: 'req_x', guestId: 'you', partySize: 1, venueId: '', code: 'FNC-4821', issuedAt: NOW },
    ],
    threads: [
      { id: 'th_a', requestId: 'req_a', participantIds: ['you', 'biz-nightform'], createdAt: NOW - HOUR, lastMessageAt: NOW - HOUR / 2, status: 'open' },
    ],
    messages: [
      { id: 'm1', threadId: 'th_a', senderId: 'you', body: 'four of us', sentAt: NOW - HOUR, readBy: ['you'] },
      { id: 'm2', threadId: 'th_a', senderId: 'system', body: 'Nightform accepted', sentAt: NOW - HOUR / 2, readBy: [] },
    ],
    idVerifications: [],
    accounts: {
      u_test: {
        role: 'consumer', businessId: null, email: 'a@b.c', phone: null, dob: '1999-03-04',
        verification: { status: 'verified', method: 'id_upload', submittedAt: NOW - HOUR, verifiedAt: NOW - HOUR },
        profileComplete: true, onboardingComplete: true, premium: false, createdAt: NOW - 2 * HOUR,
      },
      u_kid: {
        role: 'consumer', businessId: null, email: null, phone: null, dob: '2012-01-01',
        verification: { status: 'rejected', method: 'id_upload', submittedAt: NOW - HOUR, verifiedAt: NOW - HOUR },
        profileComplete: false, onboardingComplete: false, premium: false, createdAt: NOW - 2 * HOUR,
      },
      biz_test: {
        role: 'business', businessId: 'biz_test', email: null, phone: null, dob: null,
        verification: { status: 'verified', method: 'id_upload', submittedAt: NOW - HOUR, verifiedAt: NOW - HOUR },
        profileComplete: true, onboardingComplete: true, premium: true, createdAt: NOW - 2 * HOUR,
      },
    },
    session: { personId: 'u_test' },
    newPeople: [
      { id: 'u_test', name: 'Filter Test', initial: 'F', status: 'red', age: 27, verified: true, bio: 'hi', ig: '@ft', tokens: 3, spots: 2, nights: 5 },
    ],
    newBusinesses: [
      { id: 'biz_test', name: 'ClaimTestCo', kind: 'promoter', venueIds: ['chapel'], verified: true, tier: 'standard', bio: 'we run it', avatarInitial: 'C' },
    ],
    newStories: [
      { id: 'st_a', venue: 'monarch', by: 'you', postedAt: NOW - 20 * 60 * 1000, mins: 20, atVenue: true, g: ['#12E08A', '#0B7A5B'] },
    ],
    newTables: [
      // Float dollars with cents — the value the old writer would have floored.
      { id: 't9', venue: 'chapel', name: 'Balcony', seats: 4, left: 4, perHead: 24.5, host: 'ClaimTestCo', hostKind: 'promoter', businessId: 'biz_test', vibe: 'Live' },
    ],
    newSpots: [
      { id: 'spot_a', name: 'Yamo', lat: 37.7639, lon: -122.4222, x: 1, y: 2, by: 'Sana', byId: 'p4', note: 'six seats', tokens: 99, kind: 'spot' },
    ],
    visits: [
      { id: 'v1', personId: 'you', spotId: 'spot_a', at: NOW - HOUR },
      { id: 'v2', personId: 'you', spotId: 'spot_a', at: NOW },
      { id: 'v3', personId: 'p1', spotId: 'spot_a', at: NOW },
    ],
    checkins: [{ id: 'ci1', personId: 'you', venueId: 'monarch', at: NOW, expiresAt: NOW + 3 * HOUR }],
    interest: [{ id: 'i1', fromId: 'p1', toId: 'you', at: NOW }],
    saved: [{ id: 'sv1', personId: 'you', kind: 'venue', refId: 'audio', at: NOW }],
  };
}

describe('recognising a legacy root', () => {
  it('recognises the prototype shape', () => {
    assert.equal(looksLikeLegacy(legacyRoot()), true);
  });

  it('does not mistake a current document for one', () => {
    assert.equal(looksLikeLegacy({ schemaVersion: 1, state: {} }), false);
    assert.equal(looksLikeLegacy(null), false);
    assert.equal(looksLikeLegacy('nonsense'), false);
  });
});

describe('presence carries across without granting anything new', () => {
  const state = importLegacy(legacyRoot(), NOW);

  it('maps the traffic light', () => {
    assert.equal(state.presence['you']?.presence.kind, 'dtf');
    assert.equal(state.presence['p1']?.presence.kind, 'casual');
    assert.equal(state.presence['p5']?.presence.kind, 'off');
  });

  it('treats the disco badge as green, since that is what it meant', () => {
    assert.equal(state.presence['p6']?.presence.kind, 'dtf');
  });

  it('arrives off if the old window had already lapsed', () => {
    assert.equal(state.presence['lapsed']?.presence.kind, 'off');
  });

  it('keeps the window the user actually had, rather than extending it', () => {
    // Recomputing to the new next-noon rule would hand people visibility they
    // never agreed to.
    const p = state.presence['you']?.presence;
    assert.equal(p?.kind === 'dtf' && p.expiresAt, NOW + 4 * HOUR);
  });

  it('defaults the mutuals setting to off for everyone', () => {
    // It did not exist before. A migration must never grant a sharing
    // permission the user was never asked for.
    for (const profile of Object.values(state.presence)) {
      assert.equal(profile.shareWithMutuals, false);
    }
    assert.equal(isDtf(state.presence['you']!, NOW), true);
    assert.equal(resolvePresence(state.presence['lapsed']!.presence, NOW).kind, 'off');
  });

  it('gives an imported person a presence record even with no status row', () => {
    assert.ok(state.presence['u_test']);
  });
});

describe('accounts and the age gate survive intact', () => {
  const state = importLegacy(legacyRoot(), NOW);

  it('carries a verified consumer', () => {
    const account = state.accounts['u_test'];
    assert.equal(account?.verification.status, 'verified');
    assert.equal(account?.dateOfBirth, '1999-03-04');
    assert.equal(account?.role, 'consumer');
  });

  it('keeps an under-age rejection rejected, and attributes it', () => {
    // The old store rejected for exactly one reason, so this is safe to name.
    const account = state.accounts['u_kid'];
    assert.equal(account?.verification.status, 'rejected');
    assert.equal(account?.verification.rejectionReason, 'under_age');
  });

  it('keeps a business as its own actor', () => {
    const account = state.accounts['biz_test'];
    assert.equal(account?.role, 'business');
    assert.equal(account?.businessId, 'biz_test');
    assert.equal(account?.premium, true);
  });

  it('carries the signed-in session', () => {
    assert.equal(state.session.personId, 'u_test');
  });

  it('turns a runtime person into a profile with their stats', () => {
    const profile = state.profiles['u_test'];
    assert.equal(profile?.name, 'Filter Test');
    assert.equal(profile?.instagram, '@ft');
    assert.equal(profile?.nightsOut, 5);
  });
});

describe('access state survives intact', () => {
  const state = importLegacy(legacyRoot(), NOW);

  it('carries requests with their party size', () => {
    const accepted = state.requests.find((r) => r.id === 'req_a');
    assert.equal(accepted?.partySize, 4);
    assert.equal(accepted?.status, 'accepted');
  });

  it('defaults a missing party size to one rather than zero', () => {
    // Zero would make the row consume no capacity at all.
    assert.equal(state.requests.find((r) => r.id === 'req_b')?.partySize, 1);
  });

  it('carries a usable pass', () => {
    const pass = state.passes.find((p) => p.id === 'pass_a');
    assert.equal(pass?.code, 'FNC-4820');
    assert.equal(pass?.partySize, 4);
  });

  it('drops a pass with no venue, which could never be used', () => {
    assert.equal(state.passes.some((p) => p.id === 'pass_orphan'), false);
  });

  it('converts per-head to minor units without losing the cents', () => {
    const table = state.tables.find((t) => t.id === 't9');
    assert.deepEqual(table?.perHead, { amount: 2450, currency: 'USD' });
    assert.equal(table?.venueId, 'chapel'); // legacy field was `venue`
  });
});

describe('messages, spots and the rest', () => {
  const state = importLegacy(legacyRoot(), NOW);

  it('turns the magic "system" sender into a real variant', () => {
    // An account literally named "system" could otherwise impersonate func.
    const system = state.messages.find((m) => m.id === 'm2');
    assert.equal(system?.sender.kind, 'system');
    const human = state.messages.find((m) => m.id === 'm1');
    assert.equal(human?.sender.kind, 'actor');
  });

  it('recounts spot tokens from the visit log rather than trusting the total', () => {
    // The stored total said 99; two distinct people actually visited, one twice.
    const spot = state.spots.find((s) => s.id === 'spot_a');
    assert.equal(spot?.tokens, 2);
    assert.equal(spot?.droppedBy, 'p4');
    assert.deepEqual(spot?.at, { lat: 37.7639, lon: -122.4222 });
  });

  it('carries stories with their verified mark', () => {
    const story = state.stories.find((s) => s.id === 'st_a');
    assert.equal(story?.verifiedAtVenue, true);
    assert.equal(story?.venueId, 'monarch');
    assert.deepEqual(story?.gradient, ['#12E08A', '#0B7A5B']);
  });

  it('carries check-ins, saved items, interest and heat', () => {
    assert.equal(state.checkIns.length, 1);
    assert.equal(state.saved[0]?.refId, 'audio');
    assert.equal(state.interest[0]?.fromId, 'p1');
    assert.equal(state.venueHeat['monarch'], 0.83);
  });

  it('imports no friendships, because the old data had no graph', () => {
    // `friend: true` was a flag meaning "friend of the demo user". There is no
    // per-viewer graph to carry across, and inventing one would be fabrication.
    assert.deepEqual(state.friendships, []);
  });
});

describe('the importer does not fall over on junk', () => {
  it('survives an empty root', () => {
    const state = importLegacy({ version: 4, peopleStatus: {}, requests: [] }, NOW);
    assert.equal(state.requests.length, 0);
    assert.equal(state.session.personId, null);
  });

  it('skips rows with no id rather than importing ghosts', () => {
    const root = { ...legacyRoot(), requests: [{ kind: 'table' }, { id: '', kind: 'table' }] };
    assert.equal(importLegacy(root, NOW).requests.length, 0);
  });

  it('tolerates wrong types where a number or array was expected', () => {
    const root = {
      ...legacyRoot(),
      venueHeat: { monarch: 'hot' },
      visits: 'not an array',
      newSpots: [{ id: 's', name: 'x', lat: 'NaN', lon: null, byId: 'p1' }],
    };
    const state = importLegacy(root, NOW);
    assert.equal(state.venueHeat['monarch'], undefined);
    assert.deepEqual(state.visits, []);
    assert.deepEqual(state.spots[0]?.at, { lat: 0, lon: 0 });
  });
});
