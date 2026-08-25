import assert from 'node:assert/strict';
import test from 'node:test';
import { isHappeningNow, seatsTaken, attendingPartySize, seatsLeft, isFull, capacityLabel, MAX_POOL_SIZE } from '../pool';
import type { PoolInvite } from '../types';

const NOW = new Date('2026-08-21T22:00:00Z');

function invite(startsAt?: string): PoolInvite {
  return {
    id: 'i1',
    hostGroupId: 'g1',
    description: 'test',
    location: { lat: 0, lng: 0 },
    capacity: { mode: 'uncapped' },
    access: { mode: 'public' },
    requests: [],
    attendeeGroupIds: [],
    groupChatId: 'c1',
    createdByAccountType: 'personal',
    createdAt: NOW.toISOString(),
    ...(startsAt ? { startsAt } : {}),
  };
}

test('an invite with no scheduled start reads as happening now', () => {
  assert.equal(isHappeningNow(invite(), NOW), true);
});

test('an invite whose scheduled start has already arrived reads as happening now', () => {
  const started = new Date(NOW.getTime() - 60_000).toISOString();
  assert.equal(isHappeningNow(invite(started), NOW), true);
});

test('an invite scheduled for later does not read as happening now', () => {
  const later = new Date(NOW.getTime() + 3_600_000).toISOString();
  assert.equal(isHappeningNow(invite(later), NOW), false);
});

// ---------------------------------------------------------------------------
// Capacity / party-size numeric integrity (Stage 11 finding 6)
// ---------------------------------------------------------------------------

const BAD_SIZES = [NaN, Infinity, -Infinity, 2.5, 0, -3, MAX_POOL_SIZE + 1];

function capInvite(overrides: Partial<PoolInvite> = {}): PoolInvite {
  return {
    id: 'i1',
    hostGroupId: 'g_host',
    description: 'test',
    location: { lat: 0, lng: 0 },
    capacity: { mode: 'capped', max: 10 },
    access: { mode: 'public' },
    requests: [],
    attendeeGroupIds: ['g_host', 'g_a'],
    groupChatId: 'c1',
    createdByAccountType: 'personal',
    createdAt: NOW.toISOString(),
    ...overrides,
  };
}

test('MAX_POOL_SIZE is a conservative, documented, positive integer bound', () => {
  assert.ok(Number.isInteger(MAX_POOL_SIZE) && MAX_POOL_SIZE > 0);
});

test('seatsTaken ignores non-finite, fractional, non-positive, or excessive party sizes instead of propagating them', () => {
  for (const bad of BAD_SIZES) {
    const inv = capInvite({
      attendeeGroupIds: ['g_host', 'g_bad'],
      requests: [{ requestingGroupId: 'g_bad', partySize: bad, status: 'accepted' }],
    });
    assert.equal(seatsTaken(inv, () => 1), 0, `bad party size ${bad} should not be counted`);
  }
});

test('seatsTaken sums only valid accepted party sizes, falling back to group size when there is no request record', () => {
  const inv = capInvite({
    attendeeGroupIds: ['g_host', 'g_a', 'g_b'],
    requests: [{ requestingGroupId: 'g_a', partySize: 3, status: 'accepted' }],
  });
  assert.equal(seatsTaken(inv, (g) => (g === 'g_b' ? 2 : 1)), 5);
});

test('attendingPartySize is 0 for invalid persisted data rather than a fabricated value', () => {
  for (const bad of BAD_SIZES) {
    const inv = capInvite({ requests: [{ requestingGroupId: 'g_a', partySize: bad, status: 'accepted' }] });
    assert.equal(attendingPartySize(inv, 'g_a', () => 1), 0);
  }
  const valid = capInvite({ requests: [{ requestingGroupId: 'g_a', partySize: 4, status: 'accepted' }] });
  assert.equal(attendingPartySize(valid, 'g_a', () => 1), 4);
});

test('seatsLeft fails closed to 0 for an invalid capacity maximum, never NaN or negative', () => {
  for (const bad of BAD_SIZES) {
    const inv = capInvite({ capacity: { mode: 'capped', max: bad } });
    assert.equal(seatsLeft(inv, () => 1), 0);
  }
});

test('seatsLeft floors at 0 on overbooking and returns the valid remainder otherwise', () => {
  const over = capInvite({
    capacity: { mode: 'capped', max: 2 },
    attendeeGroupIds: ['g_host', 'g_a'],
    requests: [{ requestingGroupId: 'g_a', partySize: 5, status: 'accepted' }],
  });
  assert.equal(seatsLeft(over, () => 1), 0);

  const room = capInvite({
    capacity: { mode: 'capped', max: 10 },
    attendeeGroupIds: ['g_host', 'g_a'],
    requests: [{ requestingGroupId: 'g_a', partySize: 4, status: 'accepted' }],
  });
  assert.equal(seatsLeft(room, () => 1), 6);
});

test('seatsLeft is null for uncapped invites regardless of any garbage left in capacity.max', () => {
  const inv = capInvite({ capacity: { mode: 'uncapped', max: NaN } });
  assert.equal(seatsLeft(inv, () => 1), null);
});

test('isFull rejects non-finite, fractional, non-positive, or excessive incoming party sizes outright', () => {
  const inv = capInvite({ capacity: { mode: 'uncapped' } });
  for (const bad of BAD_SIZES) {
    assert.equal(isFull(inv, () => 1, bad), true, `incoming party size ${bad} must be refused`);
  }
});

test('isFull with a valid incoming party size behaves as before for capped/uncapped invites', () => {
  const uncapped = capInvite({ capacity: { mode: 'uncapped' } });
  assert.equal(isFull(uncapped, () => 1, 50), false);

  const capped = capInvite({
    capacity: { mode: 'capped', max: 4 },
    attendeeGroupIds: ['g_host', 'g_a'],
    requests: [{ requestingGroupId: 'g_a', partySize: 2, status: 'accepted' }],
  });
  assert.equal(isFull(capped, () => 1, 2), false);
  assert.equal(isFull(capped, () => 1, 3), true);
});

test('capacityLabel reports "Full" rather than a garbage number for an invalid capacity maximum', () => {
  assert.equal(capacityLabel({ capacity: { mode: 'capped', max: NaN } }), 'Full');
  assert.equal(capacityLabel({ capacity: { mode: 'capped', max: -5 } }), 'Full');
  assert.equal(capacityLabel({ capacity: { mode: 'capped', max: MAX_POOL_SIZE + 1 } }), 'Full');
  assert.equal(capacityLabel({ capacity: { mode: 'capped', max: 12 } }), 'Max 12');
  assert.equal(capacityLabel({ capacity: { mode: 'uncapped' } }), 'No cap');
});
