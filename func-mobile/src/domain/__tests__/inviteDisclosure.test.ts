import assert from 'node:assert/strict';
import test from 'node:test';
import { inviteDisclosure } from '../visibility';
import { canCreateInviteAs } from '../pool';
import type { ViewerContext } from '../visibility';
import type { FuncUser, PoolInvite, Venue, VerificationStatus } from '../types';

const NOW = new Date('2026-08-21T22:00:00Z');

function personalUser(id: string): FuncUser {
  return {
    id,
    handle: id,
    activeProfile: 'personal',
    personalProfile: {
      displayName: id,
      photo: `mono:${id}`,
      liveStatus: 'off',
      premium: false,
    },
  };
}

function businessUser(id: string, venueName: string, status: VerificationStatus): FuncUser {
  return {
    id,
    handle: id,
    activeProfile: 'business',
    personalProfile: {
      displayName: id,
      photo: `mono:${id}`,
      liveStatus: 'off',
      premium: false,
    },
    businessProfile: {
      venueName,
      verification: { status, authority: 'simulated' },
    },
  };
}

function venue(id: string, name: string, location: { lat: number; lng: number } = { lat: 0, lng: 0 }, area = 'Test'): Venue {
  return {
    id,
    name,
    category: 'club',
    area,
    location,
    priceTier: 1,
    blurb: 'A test venue.',
  };
}

function invite(overrides: Partial<PoolInvite> = {}): PoolInvite {
  return {
    id: 'inv1',
    hostGroupId: 'g_host',
    description: 'test invite',
    location: { lat: 37.77, lng: -122.42 },
    capacity: { mode: 'uncapped' },
    access: { mode: 'private' },
    requests: [],
    attendeeGroupIds: ['g_host'],
    groupChatId: 'c1',
    createdByAccountType: 'personal',
    createdAt: NOW.toISOString(),
    ...overrides,
  };
}

function context(relationship: 'self' | 'friend' | 'mutual' | 'none' | 'unknown' = 'none'): ViewerContext {
  return {
    viewerUserId: 'viewer',
    viewerGroupId: 'g_viewer',
    now: NOW,
    relationshipTo: () => relationship,
    authority: 'simulated',
  };
}

test('a public invite anchored to a resolvable venueId discloses the venue coordinate to everyone', () => {
  const v = venue('v_1', 'The Grotto', { lat: 1, lng: 2 });
  const i = invite({ access: { mode: 'public' }, venueId: 'v_1' });
  const disclosure = inviteDisclosure(context(), i, personalUser('host'), [v], 'none');
  assert.equal(disclosure.kind, 'exact');
  if (disclosure.kind === 'exact') {
    assert.deepEqual(disclosure.location, { lat: 1, lng: 2 });
    assert.equal(disclosure.venueId, 'v_1');
  }
});

test('a public invite without a venueId is hidden', () => {
  const i = invite({ access: { mode: 'public' } });
  const disclosure = inviteDisclosure(context(), i, personalUser('host'), [], 'none');
  assert.equal(disclosure.kind, 'hidden');
});

test('a private invite the viewer hosts or attends discloses the exact stored coordinate', () => {
  const i = invite({ access: { mode: 'private' } });

  const hostDisclosure = inviteDisclosure(context(), i, personalUser('host'), [], 'host');
  assert.equal(hostDisclosure.kind, 'exact');
  if (hostDisclosure.kind === 'exact') assert.deepEqual(hostDisclosure.location, i.location);

  const attendingDisclosure = inviteDisclosure(context(), i, personalUser('host'), [], 'attending');
  assert.equal(attendingDisclosure.kind, 'exact');
  if (attendingDisclosure.kind === 'exact') assert.deepEqual(attendingDisclosure.location, i.location);
});

test('a private invite the viewer only requested, was denied, or is unrelated to discloses only an area label', () => {
  const v = venue('v_near', 'Nearby Spot', { lat: 37.771, lng: -122.421 }, 'Mission');
  const i = invite({ access: { mode: 'private' }, location: { lat: 37.77, lng: -122.42 } });
  for (const relation of ['requested', 'denied', 'none'] as const) {
    const disclosure = inviteDisclosure(context(), i, personalUser('host'), [v], relation);
    assert.equal(disclosure.kind, 'area');
    if (disclosure.kind === 'area') assert.equal(disclosure.areaLabel, 'Mission');
  }
});

test('an invite from an unverified business host is hidden', () => {
  const host = businessUser('biz', 'The Velvet Lantern', 'unverified');
  const i = invite({ createdByAccountType: 'business', access: { mode: 'private' } });
  const disclosure = inviteDisclosure(context(), i, host, [], 'host');
  assert.equal(disclosure.kind, 'hidden');
});

test('an invite with an invalid location is hidden', () => {
  const i = invite({ location: { lat: Number.NaN, lng: -122.42 } });
  const disclosure = inviteDisclosure(context(), i, personalUser('host'), [], 'host');
  assert.equal(disclosure.kind, 'hidden');
});

test('canCreateInviteAs allows personal accounts and only verified business accounts', () => {
  assert.deepEqual(canCreateInviteAs(personalUser('p1')), { ok: true });
  assert.deepEqual(canCreateInviteAs(businessUser('b1', 'Verified Co', 'verified')), { ok: true });

  const unverified = canCreateInviteAs(businessUser('b2', 'Unverified Co', 'unverified'));
  assert.equal(unverified.ok, false);

  const pending = canCreateInviteAs(businessUser('b3', 'Pending Co', 'pending'));
  assert.equal(pending.ok, false);
});
