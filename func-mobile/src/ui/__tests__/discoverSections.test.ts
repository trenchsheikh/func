import assert from 'node:assert/strict';
import test from 'node:test';
import type { InviteCardView } from '@/data/views';
import type { LatLng, Venue } from '@/domain/types';
import { browseSections, type Item } from '../map/browse';

const NOW = new Date('2026-08-21T22:00:00Z');
const VIEWER: LatLng = { lat: 37.7749, lng: -122.4194 };

function venue(id: string, category: Venue['category'], location: LatLng = VIEWER): Venue {
  return { id, name: id, category, area: 'Test', location, priceTier: 1, blurb: '' };
}

function invite(id: string, opts: { startsAt?: string; location?: LatLng } = {}): InviteCardView {
  return {
    id,
    description: id,
    createdAt: NOW.toISOString(),
    ...(opts.startsAt ? { startsAt: opts.startsAt } : {}),
    access: { mode: 'public' },
    capacity: { mode: 'uncapped' },
    seatsLeft: null,
    goingCount: 0,
    hostedByVerifiedBusiness: false,
    host: { id: 'host1', displayName: 'Host', handle: 'host', photo: 'mono:111111' },
    where: { kind: 'exact', location: opts.location ?? VIEWER },
    viewer: { relation: 'none' },
  };
}

function itemsUnderHeader(sections: Item[], label: string): Item[] {
  const start = sections.findIndex((i) => i.type === 'header' && i.label === label);
  assert.ok(start !== -1, `no "${label}" header found`);
  const out: Item[] = [];
  for (let i = start + 1; i < sections.length; i++) {
    const item = sections[i];
    if (!item || item.type === 'header') break;
    out.push(item);
  }
  return out;
}

function inviteIdsUnderHeader(sections: Item[], label: string): string[] {
  return itemsUnderHeader(sections, label)
    .filter((i): i is Extract<Item, { type: 'invite' }> => i.type === 'invite')
    .map((i) => i.invite.id);
}

function venueIdsUnderHeader(sections: Item[], label: string): string[] {
  return itemsUnderHeader(sections, label)
    .filter((i): i is Extract<Item, { type: 'venue' }> => i.type === 'venue')
    .map((i) => i.venue.id);
}

test('an empty invites/venues input produces no sections', () => {
  assert.deepEqual(browseSections([], [], VIEWER, NOW), []);
});

test('Live Near You holds only invites happening now; scheduled ones surface in Near You instead — nothing is hidden', () => {
  const later = invite('later', { startsAt: new Date(NOW.getTime() + 3_600_000).toISOString() });
  const now1 = invite('now1');
  const sections = browseSections([later, now1], [], VIEWER, NOW);
  assert.deepEqual(inviteIdsUnderHeader(sections, 'Live Near You'), ['now1']);
  assert.deepEqual(inviteIdsUnderHeader(sections, 'Near You'), ['later']);
});

test('Live Near You sorts by distance from the viewer when a location is known', () => {
  const far = invite('far', { location: { lat: 37.9, lng: -122.1 } });
  const near = invite('near', { location: { lat: 37.775, lng: -122.4195 } });
  const sections = browseSections([far, near], [], VIEWER, NOW);
  assert.deepEqual(inviteIdsUnderHeader(sections, 'Live Near You'), ['near', 'far']);
});

test('Near You (scheduled invites) also sorts by distance from the viewer', () => {
  const laterAt = new Date(NOW.getTime() + 3_600_000).toISOString();
  const far = invite('far', { startsAt: laterAt, location: { lat: 37.9, lng: -122.1 } });
  const near = invite('near', { startsAt: laterAt, location: { lat: 37.775, lng: -122.4195 } });
  const sections = browseSections([far, near], [], VIEWER, NOW);
  assert.deepEqual(inviteIdsUnderHeader(sections, 'Near You'), ['near', 'far']);
});

test('with no viewer location, sections still build without crashing', () => {
  const sections = browseSections([invite('a')], [venue('v1', 'bar')], null, NOW);
  assert.deepEqual(inviteIdsUnderHeader(sections, 'Live Near You'), ['a']);
  assert.ok(venueIdsUnderHeader(sections, 'Bars').includes('v1'));
});

test('Near You is capped at the named shelf constant while venues remain fully represented in their genre row', () => {
  const laterAt = new Date(NOW.getTime() + 3_600_000).toISOString();
  const scheduled = Array.from({ length: 8 }, (_, i) => invite(`i${i}`, { startsAt: laterAt }));
  const venues = Array.from({ length: 8 }, (_, i) => venue(`v${i}`, 'bar'));
  const sections = browseSections(scheduled, venues, VIEWER, NOW);
  assert.equal(inviteIdsUnderHeader(sections, 'Near You').length, 6);
  assert.equal(venueIdsUnderHeader(sections, 'Bars').length, 8);
});

test('venues never appear under Near You — only in their genre row', () => {
  const sections = browseSections([], [venue('v1', 'bar')], VIEWER, NOW);
  assert.equal(sections.some((i) => i.type === 'header' && i.label === 'Near You'), false);
  assert.deepEqual(venueIdsUnderHeader(sections, 'Bars'), ['v1']);
});

test('shop-category venues never appear in any genre row', () => {
  const sections = browseSections([], [venue('shop1', 'shop'), venue('bar1', 'bar')], VIEWER, NOW);
  const allVenueIds = sections.filter((i) => i.type === 'venue').map((i) => i.venue.id);
  assert.ok(!allVenueIds.includes('shop1'));
  assert.ok(allVenueIds.includes('bar1'));
});
