import assert from 'node:assert/strict';
import test from 'node:test';
import { distanceKm, formatDistanceKm } from '../geo';

test('distanceKm is zero for the same point and positive for distinct points', () => {
  const a = { lat: 37.7749, lng: -122.4194 };
  assert.equal(distanceKm(a, a), 0);
  const b = { lat: 37.7849, lng: -122.4194 }; // ~1.1km north
  const d = distanceKm(a, b);
  assert.ok(d > 1 && d < 1.2, `expected ~1.1km, got ${d}`);
});

test('formatDistanceKm shows metres under 1km and one decimal place beyond', () => {
  assert.equal(formatDistanceKm(0.45), '450 m');
  assert.equal(formatDistanceKm(0.004), '4 m');
  assert.equal(formatDistanceKm(1.2), '1.2 km');
  assert.equal(formatDistanceKm(12), '12.0 km');
});
