import assert from 'node:assert/strict';
import test from 'node:test';
import { nextLocalNoon, parseIso, isPresenceLive } from '../liveStatus';

test('nextLocalNoon returns the same day at noon when before noon', () => {
  const from = new Date('2026-08-23T08:00:00');
  const noon = nextLocalNoon(from);
  assert.equal(noon.getHours(), 12);
  assert.equal(noon.getDate(), from.getDate());
});

test('nextLocalNoon returns the next day at noon when at or after noon', () => {
  const from = new Date('2026-08-23T14:00:00');
  const noon = nextLocalNoon(from);
  assert.equal(noon.getHours(), 12);
  assert.equal(noon.getDate(), from.getDate() + 1);
});

test('parseIso returns null for missing, empty, or malformed input', () => {
  assert.equal(parseIso(undefined), null);
  assert.equal(parseIso(''), null);
  assert.equal(parseIso('not a date'), null);
});

test('parseIso round-trips a canonical ISO string and rejects a non-canonical one', () => {
  const canonical = '2026-08-23T08:00:00.000Z';
  const parsed = parseIso(canonical);
  assert.ok(parsed);
  assert.equal(parsed.toISOString(), canonical);
  // A string that parses but doesn't round-trip to itself (e.g. a different
  // valid ISO representation of the same instant) is rejected — strict
  // canonical parsing, not merely "does Date accept it".
  assert.equal(parseIso('2026-08-23T08:00:00Z'), null);
});

test('isPresenceLive is true only when not off, since/expires are valid, and since <= now < expires', () => {
  const now = new Date('2026-08-23T20:00:00.000Z');
  const since = new Date('2026-08-23T18:00:00.000Z').toISOString();
  const expires = new Date('2026-08-24T12:00:00.000Z').toISOString();
  assert.equal(isPresenceLive({ displayName: 'x', photo: 'mono:#000', liveStatus: 'dtf', liveStatusSince: since, liveStatusExpiresAt: expires, premium: false }, now), true);
});

test('isPresenceLive is false once now reaches or passes the stamped expiry -- it is never recomputed from since', () => {
  const since = new Date('2026-08-22T08:00:00.000Z').toISOString();
  const expires = new Date('2026-08-22T12:00:00.000Z').toISOString();
  const base = { displayName: 'x', photo: 'mono:#000', liveStatus: 'dtf' as const, liveStatusSince: since, liveStatusExpiresAt: expires, premium: false };
  assert.equal(isPresenceLive(base, new Date('2026-08-22T12:00:00.000Z')), false); // now < expires is strict
  assert.equal(isPresenceLive(base, new Date('2026-08-23T13:00:00.000Z')), false); // well past expiry
});

test('isPresenceLive is false when liveStatus is off, even with an otherwise-valid since/expires', () => {
  const now = new Date('2026-08-23T20:00:00.000Z');
  const expires = new Date('2026-08-24T12:00:00.000Z').toISOString();
  assert.equal(isPresenceLive({ displayName: 'x', photo: 'mono:#000', liveStatus: 'off', liveStatusSince: now.toISOString(), liveStatusExpiresAt: expires, premium: false }, now), false);
});

test('isPresenceLive is false when since or expires is missing, malformed, non-canonical, or in the future', () => {
  const now = new Date('2026-08-23T20:00:00.000Z');
  const validExpires = new Date('2026-08-24T12:00:00.000Z').toISOString();
  const base = { displayName: 'x', photo: 'mono:#000', liveStatus: 'dtf' as const, premium: false };
  assert.equal(isPresenceLive({ ...base, liveStatusExpiresAt: validExpires }, now), false); // no since
  assert.equal(isPresenceLive({ ...base, liveStatusSince: now.toISOString() }, now), false); // no expires
  assert.equal(isPresenceLive({ ...base, liveStatusSince: 'garbage', liveStatusExpiresAt: validExpires }, now), false); // malformed since
  assert.equal(isPresenceLive({ ...base, liveStatusSince: now.toISOString(), liveStatusExpiresAt: 'garbage' }, now), false); // malformed expires
  // non-canonical expires (parses, but doesn't round-trip to itself)
  assert.equal(isPresenceLive({ ...base, liveStatusSince: now.toISOString(), liveStatusExpiresAt: '2026-08-24T12:00:00Z' }, now), false);
  assert.equal(isPresenceLive({ ...base, liveStatusSince: new Date(now.getTime() + 60_000).toISOString(), liveStatusExpiresAt: validExpires }, now), false); // since in the future
});

test('isPresenceLive is false when the stamped expiry is inconsistent with since (at or before it)', () => {
  const now = new Date('2026-08-23T20:00:00.000Z');
  const base = { displayName: 'x', photo: 'mono:#000', liveStatus: 'dtf' as const, liveStatusSince: now.toISOString(), premium: false };
  assert.equal(isPresenceLive({ ...base, liveStatusExpiresAt: now.toISOString() }, now), false); // expires === since
  assert.equal(isPresenceLive({ ...base, liveStatusExpiresAt: new Date(now.getTime() - 60_000).toISOString() }, now), false); // expires before since
});
