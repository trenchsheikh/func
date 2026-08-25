import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSeed } from '@/data/seed';
import type { Snapshot } from '@/data/repository';
import { viewFor } from '@/data/views';
import { nextLocalNoon } from '@/domain/liveStatus';
import { viewerLocation } from '../viewerGeo';

const NOW = new Date('2026-08-23T20:00:00.000Z');

/**
 * `buildSeed` stamps every live user's `liveStatusSince` as exactly its
 * `now` argument, while `lastKnownLocation.timestamp` predates that instant
 * -- so `validFix` correctly fails-closed at the seed's own "now" (see
 * `mapContent.test.ts`, which established this same fixture pattern). This
 * backdates `liveStatusSince` (and its stamped `liveStatusExpiresAt`,
 * recomputed from the same backdated instant) so the seed's existing fixes
 * validate.
 */
function withValidLiveFixes(snap: Snapshot, now: Date): Snapshot {
  const sinceDate = new Date(now.getTime() - 4 * 3_600_000);
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

test('viewerLocation returns the viewer\'s own fix when their presence discloses as self', () => {
  const view = viewFor(withValidLiveFixes(buildSeed(NOW), NOW), NOW); // Maya, casual and live
  const loc = viewerLocation(view);
  assert.ok(loc);
  assert.equal(loc?.lat, 37.7601);
  assert.equal(loc?.lng, -122.4201);
});

test('viewerLocation is null when the viewer is off -- there is no self disclosure to read a location from', () => {
  const seed = buildSeed(NOW);
  const maya = seed.users.find((u) => u.id === 'u_maya')!;
  maya.personalProfile.liveStatus = 'off';
  const view = viewFor(seed, NOW);
  assert.equal(viewerLocation(view), null);
});
