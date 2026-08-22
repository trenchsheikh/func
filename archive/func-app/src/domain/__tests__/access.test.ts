import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  acceptRequest,
  afterGoingCount,
  cancelRequest,
  canSeeAfterAddress,
  declineRequest,
  FREE_PENDING_CAP,
  isValidPartySize,
  passCode,
  sendRequest,
  tableSeatsLeft,
  type AccessRequest,
  type AfterParty,
  type RequestTarget,
  type TableOffer,
} from '../access';
import { fixedClock } from '../clock';
import { money } from '../geography';
import {
  asAfterPartyId,
  asBusinessId,
  asPassId,
  asPersonId,
  asRequestId,
  asTableId,
  asVenueId,
} from '../ids';

const NOW = Date.parse('2026-08-09T04:00:00Z');
const clock = fixedClock(NOW);

const GUEST = asPersonId('guest');
const HOST_BIZ = asBusinessId('biz-nightform');
const AFTER_HOST = asPersonId('kit');
const VENUE = asVenueId('monarch');

const table: TableOffer = {
  id: asTableId('t1'),
  venueId: VENUE,
  businessId: HOST_BIZ,
  name: 'Booth 5',
  seats: 6,
  perHead: money(4000, 'USD'),
  vibe: 'House',
};

const after: AfterParty = {
  id: asAfterPartyId('a1'),
  hostId: AFTER_HOST,
  area: 'Potrero Hill',
  capacity: 20,
  baseGoing: 14,
  vibe: ['Rooftop'],
  address: '1180 Rhode Island St, Apt 4',
  note: '',
};

const tableTarget: RequestTarget = { kind: 'table', table };
const afterTarget: RequestTarget = { kind: 'after', after };

let seq = 0;
const send = (
  overrides: Partial<Parameters<typeof sendRequest>[0]> = {},
) =>
  sendRequest(
    {
      guestId: GUEST,
      partySize: 2,
      target: tableTarget,
      existingRequests: [],
      guestIsPremium: false,
      newRequestId: asRequestId(`req${(seq += 1)}`),
      newThreadId: `th${seq}` as never,
      ...overrides,
    },
    clock,
  );

function accepted(partySize: number, tableId = table.id): AccessRequest {
  return {
    id: asRequestId(`acc${(seq += 1)}`),
    kind: 'table',
    guestId: asPersonId(`g${seq}`),
    hostId: HOST_BIZ,
    partySize,
    venueId: VENUE,
    tableId,
    afterId: null,
    status: 'accepted',
    createdAt: NOW,
    respondedAt: NOW,
    declineReason: null,
    passId: null,
    threadId: null,
  };
}

describe('party size is a product rule, not a UI constant', () => {
  it('accepts 1 through 6', () => {
    for (const n of [1, 2, 3, 4, 5, 6]) assert.equal(isValidPartySize(n), true);
  });

  it('rejects zero, negatives, sevens and fractions', () => {
    for (const n of [0, -1, 7, 2.5, NaN]) assert.equal(isValidPartySize(n), false);
  });

  it('refuses a request with an impossible party size', () => {
    const result = send({ partySize: 0 });
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.error, 'invalid_party_size');
  });
});

describe('a host cannot request their own listing', () => {
  it('blocks at send time', () => {
    const result = send({ guestId: HOST_BIZ as never });
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.error, 'own_listing');
  });

  it('blocks at accept time too, for requests already in storage', () => {
    // Predates the send-time guard; accept is where a seat is really consumed.
    const selfRequest: AccessRequest = {
      ...accepted(2),
      id: asRequestId('legacy'),
      guestId: HOST_BIZ as never,
      status: 'pending',
    };
    const result = acceptRequest(
      {
        request: selfRequest,
        actingAs: HOST_BIZ,
        target: tableTarget,
        allRequests: [selfRequest],
        newPassId: asPassId('p1'),
        passSequence: 0,
      },
      clock,
    );
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.error, 'own_listing');
  });
});

describe('pending caps and duplicates', () => {
  const pendingFor = (n: number): AccessRequest[] =>
    Array.from({ length: n }, (_, i) => ({
      ...accepted(1, asTableId(`other${i}`)),
      status: 'pending' as const,
      guestId: GUEST,
    }));

  it('caps free accounts at three pending', () => {
    const result = send({ existingRequests: pendingFor(FREE_PENDING_CAP) });
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.error, 'request_cap');
  });

  it('lets premium past the cap', () => {
    const result = send({
      existingRequests: pendingFor(FREE_PENDING_CAP),
      guestIsPremium: true,
    });
    assert.equal(result.ok, true);
  });

  it('counts only pending requests toward the cap', () => {
    const resolved = pendingFor(FREE_PENDING_CAP).map((r) => ({
      ...r,
      status: 'declined' as const,
    }));
    assert.equal(send({ existingRequests: resolved }).ok, true);
  });

  it('blocks a second pending request for the same table', () => {
    const existing: AccessRequest = {
      ...accepted(2),
      status: 'pending',
      guestId: GUEST,
      tableId: table.id,
    };
    const result = send({ existingRequests: [existing] });
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.error, 'duplicate');
  });

  it('allows a request for a different table', () => {
    const existing: AccessRequest = {
      ...accepted(2),
      status: 'pending',
      guestId: GUEST,
      tableId: asTableId('somewhere-else'),
    };
    assert.equal(send({ existingRequests: [existing] }).ok, true);
  });
});

describe('capacity counts people, not requests', () => {
  it('reports seats left as seats minus the sum of party sizes', () => {
    // The original bug: four accepted requests of one person each read as
    // "four taken", but a single accepted party of four read as "one".
    assert.equal(tableSeatsLeft(table, [accepted(4)]), 2);
    assert.equal(tableSeatsLeft(table, [accepted(1), accepted(1)]), 4);
    assert.equal(tableSeatsLeft(table, [accepted(4), accepted(2)]), 0);
  });

  it('never reports negative seats', () => {
    assert.equal(tableSeatsLeft(table, [accepted(6), accepted(4)]), 0);
  });

  it('refuses a party larger than the seats remaining', () => {
    const request: AccessRequest = { ...accepted(4), status: 'pending', guestId: GUEST };
    const result = acceptRequest(
      {
        request,
        actingAs: HOST_BIZ,
        // 6-seat table with 4 already taken leaves 2; this party is 4.
        target: tableTarget,
        allRequests: [request, accepted(4)],
        newPassId: asPassId('p2'),
        passSequence: 1,
      },
      clock,
    );
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.error, 'at_capacity');
  });

  it('accepts a party that exactly fills the table', () => {
    const request: AccessRequest = { ...accepted(2), status: 'pending', guestId: GUEST };
    const result = acceptRequest(
      {
        request,
        actingAs: HOST_BIZ,
        target: tableTarget,
        allRequests: [request, accepted(4)],
        newPassId: asPassId('p3'),
        passSequence: 2,
      },
      clock,
    );
    assert.equal(result.ok, true);
  });

  it('counts after-party capacity from its existing headcount', () => {
    assert.equal(afterGoingCount(after, []), 14);
    assert.equal(afterGoingCount(after, [{ ...accepted(3), afterId: after.id, tableId: null }]), 17);
  });
});

describe('accepting issues a pass and advances the night count', () => {
  const pending: AccessRequest = { ...accepted(2), status: 'pending', guestId: GUEST };

  it('issues a pass for a table', () => {
    const result = acceptRequest(
      {
        request: pending,
        actingAs: HOST_BIZ,
        target: tableTarget,
        allRequests: [pending],
        newPassId: asPassId('p4'),
        passSequence: 0,
      },
      clock,
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.request.status, 'accepted');
    assert.equal(result.value.pass?.code, passCode(0));
    assert.equal(result.value.pass?.partySize, 2);
    assert.equal(result.value.incrementNightsFor, GUEST);
    assert.equal(result.value.revealedAddress, null);
  });

  it('reveals the address for an after-party, and issues no pass', () => {
    const ask: AccessRequest = {
      ...pending,
      kind: 'after',
      hostId: AFTER_HOST,
      tableId: null,
      venueId: null,
      afterId: after.id,
    };
    const result = acceptRequest(
      {
        request: ask,
        actingAs: AFTER_HOST,
        target: afterTarget,
        allRequests: [ask],
        newPassId: asPassId('p5'),
        passSequence: 1,
      },
      clock,
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.pass, null);
    assert.equal(result.value.revealedAddress, after.address);
  });

  it('refuses a second resolution of the same request', () => {
    const already: AccessRequest = { ...pending, status: 'accepted' };
    const result = acceptRequest(
      {
        request: already,
        actingAs: HOST_BIZ,
        target: tableTarget,
        allRequests: [already],
        newPassId: asPassId('p6'),
        passSequence: 2,
      },
      clock,
    );
    assert.equal(result.ok === false && result.error, 'already_resolved');
  });
});

describe('only the right actor may act', () => {
  const pending: AccessRequest = { ...accepted(2), status: 'pending', guestId: GUEST };

  it('refuses acceptance by anyone but the host', () => {
    const result = acceptRequest(
      {
        request: pending,
        actingAs: asPersonId('someone-else'),
        target: tableTarget,
        allRequests: [pending],
        newPassId: asPassId('p7'),
        passSequence: 3,
      },
      clock,
    );
    assert.equal(result.ok === false && result.error, 'not_authorized');
  });

  it('refuses a decline by the guest', () => {
    const result = declineRequest(pending, GUEST, 'no thanks', clock);
    assert.equal(result.ok === false && result.error, 'not_authorized');
  });

  it('lets the host decline with a reason', () => {
    const result = declineRequest(pending, HOST_BIZ, 'full tonight', clock);
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.value.declineReason, 'full tonight');
  });

  it('refuses a cancel by the host', () => {
    const result = cancelRequest(pending, HOST_BIZ as never, clock);
    assert.equal(result.ok === false && result.error, 'not_authorized');
  });

  it('lets the guest cancel', () => {
    const result = cancelRequest(pending, GUEST, clock);
    assert.equal(result.ok && result.value.status, 'cancelled');
  });
});

describe('an after-party address is revealed only on accept', () => {
  const base: AccessRequest = {
    ...accepted(2),
    kind: 'after',
    guestId: GUEST,
    hostId: AFTER_HOST,
    afterId: after.id,
    tableId: null,
    venueId: null,
  };

  it('hides it from someone with no request', () => {
    assert.equal(canSeeAfterAddress(after, GUEST, []), false);
  });

  it('hides it while the request is still pending', () => {
    assert.equal(canSeeAfterAddress(after, GUEST, [{ ...base, status: 'pending' }]), false);
  });

  it('hides it after a decline', () => {
    assert.equal(canSeeAfterAddress(after, GUEST, [{ ...base, status: 'declined' }]), false);
  });

  it('shows it once accepted', () => {
    assert.equal(canSeeAfterAddress(after, GUEST, [{ ...base, status: 'accepted' }]), true);
  });

  it('always shows it to the host', () => {
    assert.equal(canSeeAfterAddress(after, AFTER_HOST, []), true);
  });

  it('does not leak it to a different accepted guest', () => {
    const someoneElse: AccessRequest = {
      ...base,
      guestId: asPersonId('other'),
      status: 'accepted',
    };
    assert.equal(canSeeAfterAddress(after, GUEST, [someoneElse]), false);
  });
});
