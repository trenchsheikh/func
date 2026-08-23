import assert from 'node:assert/strict';
import test from 'node:test';
import * as visibility from '../visibility';
import type { FuncUser, Venue } from '../types';

const NOW = new Date('2026-08-21T22:00:00Z');
const venue: Venue = {
  id: 'v_glow',
  name: 'Glow Room',
  category: 'club',
  area: 'SoMa',
  location: { lat: 37.7715, lng: -122.4123 },
  priceTier: 2,
  blurb: 'A test venue.',
};

function mutual(id: string, lat: number, lng: number): FuncUser {
  return {
    id,
    handle: id,
    activeProfile: 'personal',
    personalProfile: {
      displayName: id,
      photo: `mono:${id}`,
      liveStatus: 'dtf',
      liveStatusSince: NOW.toISOString(),
      premium: false,
      lastKnownLocation: { lat, lng, timestamp: NOW.toISOString() },
    },
  };
}

test('anonymous venue glow requires two qualifying mutuals within the venue radius', () => {
  const glow = (visibility as typeof visibility & {
    venueGlow?: (...args: never[]) => ReadonlySet<string>;
  }).venueGlow;

  assert.equal(typeof glow, 'function');
  const viewer = {
    viewerUserId: 'viewer',
    viewerGroupId: 'g_viewer',
    now: NOW,
    relationshipTo: (subjectId: string) => subjectId.startsWith('mutual') ? 'mutual' as const : 'none' as const,
    authority: 'simulated' as const,
  };
  const users = [
    mutual('mutual_one', 37.7719, -122.4123),
    mutual('mutual_two', 37.7715, -122.4128),
  ];

  assert.deepEqual([...glow?.(viewer, users, [venue]) ?? []], ['v_glow']);
  assert.deepEqual([...glow?.(viewer, users.slice(0, 1), [venue]) ?? []], []);
});
