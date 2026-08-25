import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSeed } from '@/data/seed';
import type { Snapshot } from '@/data/repository';
import { viewFor } from '@/data/views';
import { nextLocalNoon } from '@/domain/liveStatus';
import { mapPins } from '../map/content';

const NOW = new Date('2026-08-23T20:00:00.000Z'); // matches the seed's "live as of now" liveStatusSince values

/**
 * `buildSeed` stamps every live user's `liveStatusSince` as exactly its
 * `now` argument, while `lastKnownLocation.timestamp` is `now - agoHours`
 * (i.e. strictly before that instant) -- so `validFix` (which requires the
 * fix to postdate `liveStatusSince`) always fails-closed on the seed's own
 * "now". That's the production privacy rule working correctly, not a bug
 * to route around in `content.ts`/`grouping.ts`. To exercise the person/glow
 * paths this test fixture backdates `liveStatusSince` (and its stamped
 * `liveStatusExpiresAt`, recomputed from the same backdated instant) for
 * personal users who are live and have a fix, so their existing fix
 * timestamp now postdates it.
 */
function withValidLiveFixes(snap: Snapshot, now: Date): Snapshot {
  const sinceDate = new Date(now.getTime() - 4 * 3_600_000); // well before every seeded agoHours
  const since = sinceDate.toISOString();
  const expires = nextLocalNoon(sinceDate).toISOString();
  return {
    ...snap,
    users: snap.users.map((u) => {
      const p = u.personalProfile;
      if (p.liveStatus === 'off' || !p.lastKnownLocation) return u;
      return { ...u, personalProfile: { ...p, liveStatusSince: since, liveStatusExpiresAt: expires } };
    }),
  };
}

test('map projection exposes only self and eligible friend identities as person pins', () => {
  const view = viewFor(withValidLiveFixes(buildSeed(NOW), NOW), NOW); // Maya
  const personPins = mapPins(view).filter((pin) => pin.kind === 'person');
  const ids = new Set(personPins.map((pin) => pin.id));

  assert.ok(ids.has('person:u_maya'), 'self must appear as a person pin');
  assert.ok(ids.has('person:u_theo'), 'a DTF friend must appear as a person pin');
  assert.ok(ids.has('person:u_priya'), 'a DTF friend must appear as a person pin');
  assert.ok(!ids.has('person:u_rosa'), 'a casual (non-DTF) friend must not become a person pin');
  assert.ok(!ids.has('person:u_kai'), 'mutuals must not become person pins');
  assert.ok(!ids.has('person:u_dev'), 'unrelated users must not become person pins');

  for (const pin of personPins) {
    assert.equal('user' in pin, false);
    assert.ok('person' in pin);
    assert.ok(pin.disclosure.kind === 'self' || pin.disclosure.kind === 'exact');
  }
});

test('map projection surfaces a verified business as a business pin, never the operator behind it', () => {
  const view = viewFor(buildSeed(NOW), NOW); // Maya
  const businessPins = mapPins(view).filter((pin) => pin.kind === 'business');
  const ids = new Set(businessPins.map((pin) => pin.id));

  // Stage 11 persona hardening: the pin key is now the opaque venue persona
  // id (biz:<venueId>), never the raw operator FuncUser id (u_wren).
  assert.ok(ids.has('business:biz:v_audiowave'), 'Audiowave must appear as a business pin, keyed by its venue persona');
  assert.equal(ids.has('business:u_wren'), false, 'the operator\'s raw FuncUser id must never be the pin key');
  for (const pin of businessPins) {
    assert.equal('user' in pin, false);
    assert.ok('venue' in pin);
    assert.equal(pin.venue.name, 'Audiowave');
  }
});

test('map projection marks a glowing venue without exposing a mutual count', () => {
  const view = viewFor(withValidLiveFixes(buildSeed(NOW), NOW), NOW); // Maya
  const venuePins = mapPins(view).filter((pin) => pin.kind === 'venue');
  const audiowave = venuePins.find((pin) => pin.id === 'venue:v_audiowave');

  assert.ok(audiowave);
  assert.equal(audiowave?.glow, true);
  for (const pin of venuePins) {
    assert.equal('count' in pin, false);
    assert.equal('user' in pin, false);
  }
});

test('map projection excludes shop venues entirely', () => {
  const view = viewFor(buildSeed(NOW), NOW);
  const venuePins = mapPins(view).filter((pin) => pin.kind === 'venue');
  assert.ok(venuePins.every((pin) => pin.venue.category !== 'shop'));
});

test('map projection only places invite pins where the disclosed location is exact', () => {
  const view = viewFor(buildSeed(NOW), NOW);
  const invitePins = mapPins(view).filter((pin) => pin.kind === 'invite');

  const disclosedExactIds = new Set(
    view.invites.filter((inv) => inv.where.kind === 'exact').map((inv) => inv.id),
  );
  assert.equal(invitePins.length, disclosedExactIds.size);
  for (const pin of invitePins) {
    assert.ok(disclosedExactIds.has(pin.invite.id));
  }
});
