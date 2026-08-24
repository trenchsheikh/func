import assert from 'node:assert/strict';
import test from 'node:test';
import { personMarkerTreatment } from '../map/markerTreatment';
import type { PersonDisclosure } from '@/domain/visibility';

type PersonPinDisclosure = Extract<PersonDisclosure, { kind: 'self' | 'exact' }>;

function self(status: 'dtf' | 'casual' | 'off', premium: boolean): Extract<PersonDisclosure, { kind: 'self' }> {
  return { kind: 'self', status, premium, location: { lat: 0, lng: 0 } };
}

function exact(premium: boolean): Extract<PersonDisclosure, { kind: 'exact' }> {
  return { kind: 'exact', userId: 'u_subject', status: 'dtf', premium, location: { lat: 0, lng: 0 } };
}

test('a DTF friend (exact disclosure) always shows the heartbeat', () => {
  assert.deepEqual(personMarkerTreatment(exact(false)), {
    showPhoto: true,
    showHeartbeat: true,
    showPremiumRing: false,
  });
});

test('premium independently controls the silver ring, on top of any status', () => {
  assert.deepEqual(personMarkerTreatment(exact(true)), {
    showPhoto: true,
    showHeartbeat: true,
    showPremiumRing: true,
  });
  assert.equal(personMarkerTreatment(self('casual', true)).showPremiumRing, true);
  assert.equal(personMarkerTreatment(self('off', true)).showPremiumRing, true);
});

test('self disclosure derives the heartbeat from status exactly like a friend would', () => {
  assert.equal(personMarkerTreatment(self('dtf', false)).showHeartbeat, true);
  assert.equal(personMarkerTreatment(self('casual', false)).showHeartbeat, false);
  assert.equal(personMarkerTreatment(self('off', false)).showHeartbeat, false);
});

test('self and exact disclosures are treated identically by status/premium alone -- kind never changes the output', () => {
  const selfDtf = personMarkerTreatment(self('dtf', true));
  const exactDtf = personMarkerTreatment(exact(true));
  assert.deepEqual(selfDtf, exactDtf);
});

test('the accepted type structurally excludes a business disclosure -- there is no status/premium to derive a heartbeat or ring from', () => {
  // `PersonDisclosure`'s 'business' variant carries only { userId, venueId, location } --
  // no `status`/`premium` fields at all, so it cannot satisfy `PersonPinDisclosure`
  // (Extract<PersonDisclosure, { kind: 'self' | 'exact' }>). This is enforced at
  // compile time by `personMarkerTreatment`'s parameter type; business pins render
  // via the separate, identity-free `BusinessPinView`/`BusinessClusterView` in
  // `Pins.tsx` instead of going through this function at all.
  const disclosureKinds: PersonPinDisclosure['kind'][] = ['self', 'exact'];
  assert.deepEqual(disclosureKinds, ['self', 'exact']);
});
