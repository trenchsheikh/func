import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSeed } from '@/data/seed';
import { viewFor } from '@/data/views';
import type { LatLng } from '@/domain/types';
import { mapPins, type MapPin } from '../map/content';
import { accessibilityLabelForGroup, clusterRadiusDegrees, groupPins } from '../map/grouping';

const NOW = new Date('2026-08-23T20:00:00.000Z');

const SF: LatLng = { lat: 37.7749, lng: -122.4194 };
const NEARBY: LatLng = { lat: 37.775, lng: -122.4195 }; // ~15m away
const FAR: LatLng = { lat: 37.9, lng: -122.1 }; // a different neighborhood entirely

function venuePin(id: string, location: LatLng = SF): Extract<MapPin, { kind: 'venue' }> {
  return {
    kind: 'venue',
    id,
    location,
    venue: { id, name: id, category: 'bar', area: 'Test', location, priceTier: 1, blurb: '' },
    glow: false,
  };
}

function invitePin(id: string, location: LatLng = SF): Extract<MapPin, { kind: 'invite' }> {
  return {
    kind: 'invite',
    id,
    location,
    invite: {
      id,
      description: 'test invite',
      createdAt: new Date().toISOString(),
      access: { mode: 'public' },
      capacity: { mode: 'uncapped' },
      seatsLeft: null,
      goingCount: 0,
      hostedByVerifiedBusiness: false,
      host: { id: 'u_host', displayName: 'Host', handle: 'host', photo: 'mono:#000000' },
      where: { kind: 'exact', location },
      viewer: { relation: 'none' },
    },
  };
}

function personPin(id: string, location: LatLng = SF): Extract<MapPin, { kind: 'person' }> {
  return {
    kind: 'person',
    id,
    location,
    person: { id, displayName: id, handle: id, photo: 'mono:#000000' },
    disclosure: { kind: 'exact', userId: id, location, status: 'dtf', premium: false },
  };
}

function businessPin(id: string, venueName: string, location: LatLng = SF): Extract<MapPin, { kind: 'business' }> {
  return {
    kind: 'business',
    id,
    location,
    person: { id, displayName: venueName, handle: id, photo: 'mono:#000000', verifiedBusiness: { venueName } },
    venue: { id: `v_${id}`, name: venueName, category: 'club', area: 'Test', location, priceTier: 1, blurb: '' },
  };
}

test('cluster radius shrinks monotonically as zoom increases', () => {
  const globe = clusterRadiusDegrees(1);
  const city = clusterRadiusDegrees(10);
  const street = clusterRadiusDegrees(18);
  assert.ok(globe > city);
  assert.ok(city > street);
});

test('same-kind pins within radius merge into one group at low zoom', () => {
  const groups = groupPins([venuePin('v1', SF), venuePin('v2', NEARBY)], 2);
  const venueGroups = groups.filter((g) => g.kind === 'venue');
  assert.equal(venueGroups.length, 1);
  const [group] = venueGroups;
  assert.ok(group);
  assert.equal(group.pins.length, 2);
});

test('the same pins decluster into singles at street zoom', () => {
  const groups = groupPins([venuePin('v1', SF), venuePin('v2', NEARBY)], 18);
  const venueGroups = groups.filter((g) => g.kind === 'venue');
  assert.equal(venueGroups.length, 2);
  for (const g of venueGroups) assert.equal(g.pins.length, 1);
});

test('a pin far from everything else stays its own group and keeps its own id', () => {
  const groups = groupPins([venuePin('v1', SF), venuePin('v2', FAR)], 10);
  const venueGroups = groups.filter((g) => g.kind === 'venue');
  assert.equal(venueGroups.length, 2);
  const ids = venueGroups.map((g) => g.id).sort();
  assert.deepEqual(ids, ['v1', 'v2']);
});

test('venue and invite pins never share a group even at the same coordinate, at any zoom', () => {
  const groups = groupPins([venuePin('v1', SF), invitePin('i1', SF)], 1);
  assert.equal(groups.length, 2);
  assert.deepEqual(new Set(groups.map((g) => g.kind)), new Set(['venue', 'invite']));
});

test('person pins and business pins never share a group, even at the same coordinate', () => {
  const groups = groupPins([personPin('u1', SF), businessPin('biz1', 'Test Venue', SF)], 1);
  const personGroups = groups.filter((g) => g.kind === 'person');
  const businessGroups = groups.filter((g) => g.kind === 'business');
  assert.equal(personGroups.length, 1);
  assert.equal(businessGroups.length, 1);
  const [businessGroup] = businessGroups;
  assert.ok(businessGroup);
  const [businessMember] = businessGroup.pins;
  assert.ok(businessMember);
  assert.equal('disclosure' in businessMember, false, 'a business group member must never carry a person disclosure field');
});

test('grouping is deterministic regardless of input order', () => {
  const pins = [venuePin('v1', SF), venuePin('v2', NEARBY), venuePin('v3', FAR)];
  const membershipOf = (groups: ReturnType<typeof groupPins>) =>
    groups
      .map((g) => g.pins.map((p) => p.id).sort().join(','))
      .sort();

  const forward = groupPins(pins, 5);
  const reversed = groupPins([...pins].reverse(), 5);
  assert.deepEqual(membershipOf(forward), membershipOf(reversed));
});

test('grouping the real privacy-redacted mapPins() output never introduces a person beyond what was already disclosed', () => {
  const view = viewFor(buildSeed(NOW), NOW);
  const pins = mapPins(view);
  const disclosedPersonIds = new Set(pins.filter((p) => p.kind === 'person').map((p) => p.id));
  const disclosedBusinessIds = new Set(pins.filter((p) => p.kind === 'business').map((p) => p.id));

  // Globe-zoom radius is wide enough to merge everything of the same kind —
  // the worst case for accidentally pulling in something ungrouped.
  const groups = groupPins(pins, 1);

  for (const group of groups) {
    if (group.kind === 'person') {
      for (const pin of group.pins) {
        assert.ok(disclosedPersonIds.has(pin.id), 'a person cluster member must already be in mapPins’ disclosed set');
      }
    }
    if (group.kind === 'business') {
      for (const pin of group.pins) {
        assert.ok(disclosedBusinessIds.has(pin.id), 'a business cluster member must already be in mapPins’ disclosed set');
      }
    }
  }
});

test('accessibilityLabelForGroup names a single venue with its category', () => {
  const [group] = groupPins([venuePin('v1', SF)], 18);
  assert.ok(group);
  assert.equal(accessibilityLabelForGroup(group), 'v1, Bar');
});

test('accessibilityLabelForGroup speaks an invite by its description', () => {
  const [group] = groupPins([invitePin('i1', SF)], 18);
  assert.ok(group);
  assert.equal(accessibilityLabelForGroup(group), 'test invite');
});

test('accessibilityLabelForGroup names an eligible friend with their status', () => {
  const [group] = groupPins([personPin('u1', SF)], 18);
  assert.ok(group);
  assert.equal(accessibilityLabelForGroup(group), 'u1, DTF');
});

test('accessibilityLabelForGroup names a business pin by venue only, never the personal identity behind it', () => {
  const [group] = groupPins([businessPin('biz1', 'Test Venue', SF)], 18);
  assert.ok(group);
  assert.equal(accessibilityLabelForGroup(group), 'Test Venue, business');
});

test('accessibilityLabelForGroup counts a venue cluster without naming any one place', () => {
  const groups = groupPins([venuePin('v1', SF), venuePin('v2', NEARBY)], 2);
  const venueGroup = groups.find((g) => g.kind === 'venue');
  assert.ok(venueGroup);
  assert.equal(accessibilityLabelForGroup(venueGroup), '2 places nearby');
});

test('accessibilityLabelForGroup counts a friend cluster without naming anyone in it', () => {
  const groups = groupPins([personPin('u1', SF), personPin('u2', NEARBY)], 2);
  const personGroup = groups.find((g) => g.kind === 'person');
  assert.ok(personGroup);
  assert.equal(accessibilityLabelForGroup(personGroup), '2 friends nearby');
});

test('accessibilityLabelForGroup counts a business cluster without naming any one venue', () => {
  const groups = groupPins([businessPin('biz1', 'Test Venue', SF), businessPin('biz2', 'Other Venue', NEARBY)], 2);
  const businessGroup = groups.find((g) => g.kind === 'business');
  assert.ok(businessGroup);
  assert.equal(accessibilityLabelForGroup(businessGroup), '2 businesses nearby');
});
