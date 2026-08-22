import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fixedClock } from '../clock';
import { asPersonId, asStoryId, asVenueId } from '../ids';
import {
  checkIn,
  isExpired,
  liveStories,
  postStory,
  VENUE_GEOFENCE_METRES,
  type CheckIn,
} from '../stories';

const NOW = Date.parse('2026-08-09T22:00:00Z');
const clock = fixedClock(NOW);

const ME = asPersonId('me');
const OTHER = asPersonId('other');
const VENUE = { id: asVenueId('v1'), at: { lat: 37.7749, lon: -122.4194 } };

const nearby = { lat: 37.77495, lon: -122.41945 }; // a few metres away
const farAway = { lat: 37.9, lon: -122.6 };

describe('check-in requires actually being there', () => {
  it('succeeds inside the geofence', () => {
    const result = checkIn(ME, VENUE, nearby, clock);
    assert.equal(result.ok, true);
  });

  it('refuses with no device fix at all', () => {
    const result = checkIn(ME, VENUE, null, clock);
    assert.equal(result.ok, false);
    assert.equal(result.ok ? undefined : result.error, 'too_far');
  });

  it('refuses outside the geofence — no posting a verified story from the sofa', () => {
    const result = checkIn(ME, VENUE, farAway, clock);
    assert.equal(result.ok, false);
  });

  it('the geofence radius is the documented 75m, not silently redefined', () => {
    assert.equal(VENUE_GEOFENCE_METRES, 75);
  });
});

describe('postStory decides the verified mark', () => {
  const ownCheckIn = (overrides: Partial<CheckIn> = {}): CheckIn => ({
    personId: ME,
    venueId: VENUE.id,
    at: NOW - 60_000,
    expiresAt: NOW + 60_000,
    ...overrides,
  });

  it('is verified and carries the venue when the check-in is live and the poster\'s own', () => {
    const story = postStory({ id: asStoryId('s1'), by: ME, gradient: ['a', 'b'], checkIn: ownCheckIn() }, clock);
    assert.equal(story.verifiedAtVenue, true);
    assert.equal(story.venueId, VENUE.id);
  });

  it('is unverified with no check-in', () => {
    const story = postStory({ id: asStoryId('s2'), by: ME, gradient: ['a', 'b'], checkIn: null }, clock);
    assert.equal(story.verifiedAtVenue, false);
    assert.equal(story.venueId, null);
  });

  it('is unverified once the check-in has expired', () => {
    const expired = ownCheckIn({ expiresAt: NOW - 1 });
    const story = postStory({ id: asStoryId('s3'), by: ME, gradient: ['a', 'b'], checkIn: expired }, clock);
    assert.equal(story.verifiedAtVenue, false);
  });

  it('is unverified when the supplied check-in belongs to someone else', () => {
    // postStory is the one place the verified mark is decided, so it must not
    // trust a check-in it was not proven to own — even though today's only
    // caller already filters to the poster's own check-ins before this point.
    const someoneElses = ownCheckIn({ personId: OTHER });
    const story = postStory(
      { id: asStoryId('s4'), by: ME, gradient: ['a', 'b'], checkIn: someoneElses },
      clock,
    );
    assert.equal(story.verifiedAtVenue, false);
    assert.equal(story.venueId, null);
    assert.equal(story.by, ME);
  });
});

describe('stories expire', () => {
  it('is not expired just before the TTL, and is just after', () => {
    const story = postStory({ id: asStoryId('s5'), by: ME, gradient: ['a', 'b'], checkIn: null }, clock);
    const sixHoursMinusOne = NOW + 6 * 60 * 60 * 1000 - 1;
    const sixHoursPlusOne = NOW + 6 * 60 * 60 * 1000 + 1;
    assert.equal(isExpired(story, sixHoursMinusOne), false);
    assert.equal(isExpired(story, sixHoursPlusOne), true);
  });

  it('drops expired stories from the live list', () => {
    const fresh = postStory({ id: asStoryId('s6'), by: ME, gradient: ['a', 'b'], checkIn: null }, clock);
    const later = fixedClock(NOW + 7 * 60 * 60 * 1000);
    const old = postStory({ id: asStoryId('s7'), by: ME, gradient: ['a', 'b'], checkIn: null }, later);

    const live = liveStories([fresh, old], later.now());
    assert.deepEqual(live.map((s) => s.id), [old.id]);
  });
});
