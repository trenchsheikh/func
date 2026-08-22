import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Pass } from '../access';
import { fixedClock } from '../clock';
import {
  expressInterest,
  heatAfterRating,
  interestReceived,
  isMutualInterest,
  isSaved,
  isValidRating,
  latestUnratedPass,
  MAX_HEAT,
  MIN_HEAT,
  rateNight,
  saveItem,
  savedFor,
  unsaveItem,
  type Interest,
  type SavedItem,
} from '../engagement';
import { asPassId, asPersonId, asRequestId, asSpotId, asVenueId } from '../ids';

const NOW = Date.parse('2026-08-09T12:00:00Z');
const clock = fixedClock(NOW);
const ME = asPersonId('me');
const YOU = asPersonId('you');
const VENUE = asVenueId('monarch');

const pass = (over: Partial<Pass> = {}): Pass => ({
  id: asPassId('p1'),
  requestId: asRequestId('r1'),
  guestId: ME,
  partySize: 2,
  venueId: VENUE,
  tableId: null,
  code: 'FNC-4820',
  issuedAt: NOW,
  status: 'active',
  rated: false,
  ...over,
});

describe('a night rating moves heat and nothing else', () => {
  it('rejects anything that is not one to five whole stars', () => {
    for (const bad of [0, -1, 6, 2.5, NaN]) assert.equal(isValidRating(bad), false);
    for (const good of [1, 2, 3, 4, 5]) assert.equal(isValidRating(good), true);
  });

  it('cannot be sent with zero stars', () => {
    // The prototype's send button submitted a full negative rating when no
    // star had been tapped at all.
    const result = rateNight(pass(), 0, 0.5);
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.error, 'invalid_rating');
  });

  it('nudges heat up for four and five stars', () => {
    assert.ok(heatAfterRating(0.5, 4) > 0.5);
    assert.ok(heatAfterRating(0.5, 5) > 0.5);
  });

  it('pulls heat down for one, two and three stars', () => {
    // Three counts as negative — carried over from the prototype unchanged and
    // flagged for Phoenix rather than silently corrected.
    for (const stars of [1, 2, 3] as const) assert.ok(heatAfterRating(0.5, stars) < 0.5);
  });

  it('clamps at both ends', () => {
    assert.equal(heatAfterRating(1, 5), MAX_HEAT);
    assert.equal(heatAfterRating(MIN_HEAT, 1), MIN_HEAT);
    assert.ok(heatAfterRating(0.11, 1) >= MIN_HEAT);
  });

  it('marks the pass rated so it cannot be rated twice', () => {
    const first = rateNight(pass(), 5, 0.5);
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.equal(first.value.pass.rated, true);

    const second = rateNight(first.value.pass, 1, first.value.newHeat);
    assert.equal(second.ok === false && second.error, 'already_rated');
  });

  it('offers only the most recent pass, and only while unrated', () => {
    const older = pass({ id: asPassId('old'), issuedAt: NOW - 100_000 });
    const newest = pass({ id: asPassId('new'), issuedAt: NOW });
    assert.equal(latestUnratedPass([older, newest], ME)?.id, asPassId('new'));

    // Once the newest is rated, an older unrated one is not dragged back up.
    assert.equal(latestUnratedPass([older, { ...newest, rated: true }], ME), null);
  });

  it('ignores other people’s passes', () => {
    assert.equal(latestUnratedPass([pass({ guestId: YOU })], ME), null);
  });
});

describe('saving is idempotent and per person', () => {
  const SPOT = asSpotId('s1');
  let saved: readonly SavedItem[] = [];

  it('saves once however many times you tap', () => {
    saved = saveItem(saved, ME, 'venue', VENUE, clock);
    saved = saveItem(saved, ME, 'venue', VENUE, clock);
    assert.equal(saved.length, 1);
    assert.equal(isSaved(saved, ME, 'venue', VENUE), true);
  });

  it('keeps venues and spots distinct even if ids collide', () => {
    const both = saveItem(saveItem([], ME, 'venue', VENUE, clock), ME, 'spot', SPOT, clock);
    assert.equal(both.length, 2);
  });

  it('does not leak between people', () => {
    assert.equal(isSaved(saved, YOU, 'venue', VENUE), false);
    assert.deepEqual(savedFor(saved, YOU), []);
  });

  it('unsaves', () => {
    assert.equal(isSaved(unsaveItem(saved, ME, 'venue', VENUE), ME, 'venue', VENUE), false);
  });

  it('unsaving something never saved is harmless', () => {
    assert.deepEqual(unsaveItem([], ME, 'venue', VENUE), []);
  });
});

describe('interest is a real signal, not a toast', () => {
  let interest: readonly Interest[] = [];

  it('records interest once', () => {
    interest = expressInterest(interest, ME, YOU, clock);
    interest = expressInterest(interest, ME, YOU, clock);
    assert.equal(interest.length, 1);
  });

  it('drops self-interest, which would inflate what premium sells', () => {
    assert.equal(expressInterest([], ME, ME, clock).length, 0);
  });

  it('lists who wants you', () => {
    assert.equal(interestReceived(interest, YOU).length, 1);
    assert.equal(interestReceived(interest, ME).length, 0);
  });

  it('detects mutual interest only when both sides acted independently', () => {
    assert.equal(isMutualInterest(interest, ME, YOU), false);
    const both = expressInterest(interest, YOU, ME, clock);
    assert.equal(isMutualInterest(both, ME, YOU), true);
  });
});
