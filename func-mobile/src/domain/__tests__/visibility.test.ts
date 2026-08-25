import assert from 'node:assert/strict';
import test from 'node:test';
import { personDisclosure, areaLabelFor } from '../visibility';
import { nextLocalNoon } from '../liveStatus';
import type { FuncUser, VerificationStatus, Venue } from '../types';

const NOW = new Date('2026-08-21T22:00:00Z');
const VENUES: Venue[] = [];

function user(id: string, status: FuncUser['personalProfile']['liveStatus'] = 'dtf'): FuncUser {
  return {
    id,
    handle: id,
    activeProfile: 'personal',
    personalProfile: {
      displayName: id,
      photo: `mono:${id}`,
      liveStatus: status,
      liveStatusSince: NOW.toISOString(),
      liveStatusExpiresAt: nextLocalNoon(NOW).toISOString(),
      premium: false,
      lastKnownLocation: { lat: 37.77, lng: -122.42, timestamp: NOW.toISOString() },
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

function venue(name: string, location: { lat: number; lng: number } = { lat: 0, lng: 0 }): Venue {
  return {
    id: `v_${name.toLowerCase().replace(/\s+/g, '_')}`,
    name,
    category: 'club',
    area: 'Test',
    location,
    priceTier: 1,
    blurb: 'A test venue.',
  };
}

function context(relationship: 'self' | 'friend' | 'mutual' | 'none' | 'unknown', now: Date = NOW) {
  return {
    viewerUserId: 'viewer',
    viewerGroupId: 'g_viewer',
    now,
    relationshipTo: () => relationship,
    authority: 'simulated' as const,
  };
}

test('friend DTF disclosure is exact but carries no raw profile identity', () => {
  const disclosure = personDisclosure(context('friend'), user('subject'), VENUES);
  assert.equal(disclosure.kind, 'exact');
  assert.deepEqual(disclosure.location, { lat: 37.77, lng: -122.42 });
  assert.equal('displayName' in disclosure, false);
  assert.equal('photo' in disclosure, false);
});

test('casual friends, mutuals, and unrelated viewers receive no person disclosure', () => {
  assert.equal(personDisclosure(context('friend'), user('subject', 'casual'), VENUES).kind, 'none');
  assert.equal(personDisclosure(context('mutual'), user('subject'), VENUES).kind, 'none');
  assert.equal(personDisclosure(context('none'), user('subject'), VENUES).kind, 'none');
});

test('the viewer may see their own personal presence without relationship lookup', () => {
  const disclosure = personDisclosure(context('self'), user('viewer', 'casual'), VENUES);
  assert.equal(disclosure.kind, 'self');
  assert.deepEqual(disclosure.location, { lat: 37.77, lng: -122.42 });
});

test('a friend past their next local noon since DTF is no longer disclosed, even with a valid fix', () => {
  const since = new Date('2026-08-22T08:00:00.000Z').toISOString();
  const now = new Date('2026-08-23T13:00:00.000Z'); // past the noon after `since`
  const subject = user('subject', 'dtf');
  subject.personalProfile.liveStatusSince = since;
  subject.personalProfile.liveStatusExpiresAt = nextLocalNoon(new Date(since)).toISOString();
  const disclosure = personDisclosure(context('friend', now), subject, []);
  assert.equal(disclosure.kind, 'none');
});

test('a stale fix from before the current presence session is not disclosed, even while presence is live', () => {
  const since = new Date('2026-08-23T18:00:00.000Z').toISOString();
  const staleFixTimestamp = new Date('2026-08-23T08:00:00.000Z').toISOString(); // before `since`
  const now = new Date('2026-08-23T20:00:00.000Z'); // after since, before the next local noon
  const subject = user('subject', 'dtf');
  subject.personalProfile.liveStatusSince = since;
  subject.personalProfile.liveStatusExpiresAt = nextLocalNoon(new Date(since)).toISOString();
  subject.personalProfile.lastKnownLocation = { lat: 37.77, lng: -122.42, timestamp: staleFixTimestamp };
  const disclosure = personDisclosure(context('friend', now), subject, []);
  assert.equal(disclosure.kind, 'none');
});

test('an unverified business never discloses a business pin', () => {
  const wren = businessUser('wren', 'The Velvet Lantern', 'unverified');
  const disclosure = personDisclosure(context('none'), wren, [venue('The Velvet Lantern')]);
  assert.equal(disclosure.kind, 'none');
});

test('a verified business discloses at the venue coordinate', () => {
  const wren = businessUser('wren', 'Audiowave', 'verified');
  const disclosure = personDisclosure(context('none'), wren, [venue('Audiowave', { lat: 1, lng: 2 })]);
  assert.equal(disclosure.kind, 'business');
  if (disclosure.kind === 'business') assert.deepEqual(disclosure.location, { lat: 1, lng: 2 });
});

test('a verified business with an invalid venue coordinate is never disclosed, and never throws', () => {
  const wren = businessUser('wren', 'Audiowave', 'verified');
  for (const bad of [{ lat: Number.NaN, lng: 2 }, { lat: 91, lng: 2 }, { lat: 1, lng: Number.POSITIVE_INFINITY }]) {
    const disclosure = personDisclosure(context('none'), wren, [venue('Audiowave', bad)]);
    assert.equal(disclosure.kind, 'none');
  }
});

test('areaLabelFor skips venues with invalid coordinates and falls back to "Nearby" if none qualify', () => {
  const bad: Venue = { id: 'v_bad', name: 'Bad Coords', category: 'club', area: 'BadArea', location: { lat: Number.NaN, lng: -122.42 }, priceTier: 1, blurb: 'x' };
  assert.equal(areaLabelFor({ lat: 37.7715, lng: -122.4123 }, [bad]), 'Nearby');

  // Mixed in with a valid, closer venue in a different area, the bad one
  // must never win -- it should be invisible to the nearest-match search.
  const good: Venue = { id: 'v_good', name: 'Good Coords', category: 'club', area: 'GoodArea', location: { lat: 37.7715, lng: -122.4123 }, priceTier: 1, blurb: 'x' };
  assert.equal(areaLabelFor({ lat: 37.7715, lng: -122.4123 }, [bad, good]), 'GoodArea');
});
