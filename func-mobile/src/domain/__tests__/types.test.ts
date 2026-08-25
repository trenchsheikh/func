import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSeed } from '../../data/seed';
import { SEED_VENUES } from '../../data/seed/venues';
import { nextLocalNoon } from '../liveStatus';

const NOW = new Date('2026-08-23T20:00:00.000Z');

function userById(snapshot: ReturnType<typeof buildSeed>, id: string) {
  const user = snapshot.users.find((u) => u.id === id);
  assert.ok(user, `expected seeded user ${id}`);
  return user;
}

test('every non-off seeded personal profile carries liveStatusSince and a stamped liveStatusExpiresAt; off profiles carry neither', () => {
  const snapshot = buildSeed(NOW);
  const expectedExpiry = nextLocalNoon(NOW).toISOString();
  for (const user of snapshot.users) {
    if (user.personalProfile.liveStatus === 'off') {
      assert.equal(user.personalProfile.liveStatusSince, undefined, `${user.id} is off and should have no liveStatusSince`);
      assert.equal(user.personalProfile.liveStatusExpiresAt, undefined, `${user.id} is off and should have no liveStatusExpiresAt`);
    } else {
      assert.equal(user.personalProfile.liveStatusSince, NOW.toISOString(), `${user.id} is ${user.personalProfile.liveStatus} and should be live as of now`);
      assert.equal(user.personalProfile.liveStatusExpiresAt, expectedExpiry, `${user.id} should have expiry stamped at seed time`);
    }
  }
});

test('Maya’s business profile is unverified; Wren’s is verified, both simulated', () => {
  const snapshot = buildSeed(NOW);
  const maya = userById(snapshot, 'u_maya');
  assert.equal(maya.businessProfile?.venueName, 'The Velvet Lantern');
  assert.deepEqual(maya.businessProfile?.verification, { status: 'unverified', authority: 'simulated' });

  const wren = userById(snapshot, 'u_wren');
  assert.equal(wren.businessProfile?.venueName, 'Audiowave');
  assert.equal(wren.businessProfile?.verification.status, 'verified');
  assert.equal(wren.businessProfile?.verification.authority, 'simulated');
  assert.equal(wren.businessProfile?.verification.verifiedAt, NOW.toISOString());
});

test('venue-anchored invites carry a venueId that resolves to a real seeded venue', () => {
  const snapshot = buildSeed(NOW);
  const venueIds = new Set(SEED_VENUES.map((v) => v.id));
  const expected: Record<string, string> = {
    inv_dolores: 'v_dolores',
    inv_karaoke: 'v_grotto',
    inv_dinner: 'v_kaimuki',
    inv_sunrise: 'v_oceanbeach',
    inv_audiowave: 'v_audiowave',
    inv_crawl: 'v_castrocorner',
  };
  for (const [inviteId, venueId] of Object.entries(expected)) {
    const invite = snapshot.invites.find((i) => i.id === inviteId);
    assert.ok(invite, `expected seeded invite ${inviteId}`);
    assert.equal(invite?.venueId, venueId);
    assert.ok(venueIds.has(venueId), `${venueId} must exist in SEED_VENUES`);
  }
});

test('a private-place invite not on the anchored list has no venueId', () => {
  const snapshot = buildSeed(NOW);
  const afters = snapshot.invites.find((i) => i.id === 'inv_afters');
  assert.ok(afters);
  assert.equal(afters?.venueId, undefined);
});
