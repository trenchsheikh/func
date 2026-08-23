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

test('isPresenceLive is true only when not off, since is valid and in the past, and noon has not yet passed', () => {
  const now = new Date('2026-08-23T20:00:00.000Z');
  const since = new Date('2026-08-23T18:00:00.000Z').toISOString();
  assert.equal(isPresenceLive({ displayName: 'x', photo: 'mono:#000', liveStatus: 'dtf', liveStatusSince: since, premium: false }, now), true);
});

test('isPresenceLive is false once past the next local noon after since', () => {
  const since = new Date('2026-08-22T08:00:00.000Z').toISOString();
  const pastNoon = new Date('2026-08-23T13:00:00.000Z');
  assert.equal(isPresenceLive({ displayName: 'x', photo: 'mono:#000', liveStatus: 'dtf', liveStatusSince: since, premium: false }, pastNoon), false);
});

test('isPresenceLive is false when liveStatus is off, or since is missing/future/unparsable', () => {
  const now = new Date('2026-08-23T20:00:00.000Z');
  const base = { displayName: 'x', photo: 'mono:#000', premium: false } as const;
  assert.equal(isPresenceLive({ ...base, liveStatus: 'off', liveStatusSince: now.toISOString() }, now), false);
  assert.equal(isPresenceLive({ ...base, liveStatus: 'dtf' }, now), false); // no since
  assert.equal(isPresenceLive({ ...base, liveStatus: 'dtf', liveStatusSince: 'garbage' }, now), false);
  assert.equal(isPresenceLive({ ...base, liveStatus: 'dtf', liveStatusSince: new Date(now.getTime() + 60_000).toISOString() }, now), false); // future
});
