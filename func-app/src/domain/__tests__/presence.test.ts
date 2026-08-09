import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { mutableClock } from '../clock';
import {
  goCasual,
  goDtf,
  goOff,
  isDtf,
  isOut,
  nextLocalNoon,
  resolvePresence,
  timeRemaining,
  withExpiry,
  type PresenceProfile,
} from '../presence';

const LA = 'America/Los_Angeles';
const iso = (ts: number): string => new Date(ts).toISOString();
const profile = (
  presence: PresenceProfile['presence'],
  shareWithMutuals = false,
): PresenceProfile => ({ presence, shareWithMutuals });

describe('DTF expiry lands on the next local noon', () => {
  const noonAfter = (at: string, tz = LA): string =>
    iso(nextLocalNoon(Date.parse(at), tz));

  it('an evening start expires at midday the following day', () => {
    assert.equal(noonAfter('2026-08-07T21:00:00-07:00'), '2026-08-08T19:00:00.000Z');
  });

  it('treats after-midnight as the same night, not a new one', () => {
    // 1am Saturday must expire at Saturday midday — 11 hours, not 35.
    assert.equal(noonAfter('2026-08-08T01:00:00-07:00'), '2026-08-08T19:00:00.000Z');
  });

  it('noon exactly rolls to the following day', () => {
    assert.equal(noonAfter('2026-08-08T12:00:00-07:00'), '2026-08-09T19:00:00.000Z');
  });

  it('gives a short window when switched on late morning (known edge)', () => {
    // 11am -> one hour. Correct per the rule; the user can extend it.
    assert.equal(noonAfter('2026-08-08T11:00:00-07:00'), '2026-08-08T19:00:00.000Z');
  });

  it('survives a night that crosses the spring-forward transition', () => {
    assert.equal(noonAfter('2026-03-07T22:00:00-08:00'), '2026-03-08T19:00:00.000Z');
  });

  it('survives a night that crosses the fall-back transition', () => {
    assert.equal(noonAfter('2026-10-31T22:00:00-07:00'), '2026-11-01T20:00:00.000Z');
  });

  it('uses the user’s own zone, not the Americas', () => {
    assert.equal(
      noonAfter('2026-08-08T02:00:00+02:00', 'Europe/Berlin'),
      '2026-08-08T10:00:00.000Z',
    );
    assert.equal(
      noonAfter('2026-08-08T23:00:00+09:00', 'Asia/Tokyo'),
      '2026-08-09T03:00:00.000Z',
    );
  });
});

describe('presence resolves against the clock on every read', () => {
  it('reports DTF while live', () => {
    const clock = mutableClock(Date.parse('2026-08-08T04:00:00Z'), LA);
    const p = profile(goDtf(clock));
    assert.equal(isDtf(p, clock.now()), true);
  });

  it('collapses to off the instant it expires, with no timer having run', () => {
    const clock = mutableClock(Date.parse('2026-08-08T04:00:00Z'), LA);
    const presence = goDtf(clock);
    assert.equal(presence.kind, 'dtf');

    // Jump past midday without anything writing expiry back to storage.
    clock.advanceTo(Date.parse('2026-08-08T19:00:00Z'));
    assert.equal(resolvePresence(presence, clock.now()).kind, 'off');
    assert.equal(isDtf(profile(presence), clock.now()), false);
  });

  it('is still live one millisecond before expiry', () => {
    const clock = mutableClock(Date.parse('2026-08-08T04:00:00Z'), LA);
    const presence = goDtf(clock);
    clock.advanceTo(Date.parse('2026-08-08T19:00:00Z') - 1);
    assert.equal(isDtf(profile(presence), clock.now()), true);
  });

  it('counts amber as out, but never as DTF', () => {
    const clock = mutableClock(Date.parse('2026-08-08T04:00:00Z'), LA);
    const p = profile(goCasual(clock));
    assert.equal(isOut(p, clock.now()), true);
    assert.equal(isDtf(p, clock.now()), false);
  });

  it('reports no time remaining once off', () => {
    const clock = mutableClock(Date.parse('2026-08-08T04:00:00Z'), LA);
    assert.equal(timeRemaining(goOff(), clock.now()), 0);
  });
});

describe('the user stays in control of the window', () => {
  const now = Date.parse('2026-08-08T04:00:00Z');

  it('can end the night early by setting a past expiry', () => {
    const clock = mutableClock(now, LA);
    assert.equal(withExpiry(goDtf(clock), now - 1, now).kind, 'off');
  });

  it('can extend the window', () => {
    const clock = mutableClock(now, LA);
    const extended = withExpiry(goDtf(clock), now + 7_200_000, now);
    assert.equal(extended.kind, 'dtf');
    assert.equal(extended.kind !== 'off' && extended.expiresAt, now + 7_200_000);
  });

  it('switching off is immediate and unconditional', () => {
    assert.equal(goOff().kind, 'off');
  });
});
