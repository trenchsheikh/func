import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { money, type Venue } from '../geography';
import { asBusinessId, asCityId, asTableId, asVenueId } from '../ids';
import {
  claimVenue,
  claimantOf,
  postTable,
  releaseVenue,
  unclaimedVenues,
  type Business,
} from '../venues';

const MONARCH = asVenueId('monarch');
const AUDIO = asVenueId('audio');
const CHAPEL = asVenueId('chapel');

const venue = (id: ReturnType<typeof asVenueId>, name: string): Venue => ({
  id,
  name,
  kind: 'club',
  at: { lat: 37.78, lon: -122.41 },
  districtId: null,
  cityId: asCityId('sf'),
  vibe: [],
  entry: { min: money(1500, 'USD'), max: money(3000, 'USD') },
  spend: { min: money(4500, 'USD'), max: money(9000, 'USD') },
  blurb: '',
  verified: true,
});

const VENUES = [venue(MONARCH, 'Monarch'), venue(AUDIO, 'Audio'), venue(CHAPEL, 'The Chapel')];

const business = (over: Partial<Business> = {}): Business => ({
  id: asBusinessId('biz-nightform'),
  name: 'Nightform',
  kind: 'promoter',
  venueIds: [],
  verified: true,
  bio: '',
  ...over,
});

describe('claiming a venue', () => {
  it('attaches an unclaimed venue', () => {
    const result = claimVenue(business(), MONARCH, VENUES, []);
    assert.equal(result.ok, true);
    assert.deepEqual(result.ok && result.value.venueIds, [MONARCH]);
  });

  it('lets one business run more than one venue', () => {
    // Seed data already had a promoter running two, and the prototype's
    // dashboard hid the claim button after the first, making the second
    // unreachable through the UI.
    const one = claimVenue(business(), MONARCH, VENUES, []);
    assert.equal(one.ok, true);
    if (!one.ok) return;
    const two = claimVenue(one.value, AUDIO, VENUES, [one.value]);
    assert.equal(two.ok, true);
    assert.deepEqual(two.ok && two.value.venueIds, [MONARCH, AUDIO]);
  });

  it('is idempotent for a venue you already run', () => {
    const mine = business({ venueIds: [MONARCH] });
    const result = claimVenue(mine, MONARCH, VENUES, [mine]);
    assert.equal(result.ok, true);
    assert.deepEqual(result.ok && result.value.venueIds, [MONARCH]);
  });

  it('refuses a venue another business already runs, and names them', () => {
    const other = business({ id: asBusinessId('biz-folsom'), name: 'Folsom Collective', venueIds: [MONARCH] });
    const result = claimVenue(business(), MONARCH, VENUES, [other]);
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.error, 'already_claimed');
    assert.equal(result.ok === false && result.claimedBy, 'Folsom Collective');
  });

  it('refuses an unverified business', () => {
    const result = claimVenue(business({ verified: false }), MONARCH, VENUES, []);
    assert.equal(result.ok === false && result.error, 'not_verified');
  });

  it('refuses a venue that does not exist — businesses cannot invent places', () => {
    const result = claimVenue(business(), asVenueId('made-up'), VENUES, []);
    assert.equal(result.ok === false && result.error, 'unknown_venue');
  });

  it('reports who runs a venue, and what is left', () => {
    const mine = business({ venueIds: [MONARCH] });
    assert.equal(claimantOf(MONARCH, [mine])?.name, 'Nightform');
    assert.equal(claimantOf(AUDIO, [mine]), null);
    assert.deepEqual(
      unclaimedVenues(VENUES, [mine]).map((v) => v.id),
      [AUDIO, CHAPEL],
    );
  });

  it('releases a venue', () => {
    assert.deepEqual(releaseVenue(business({ venueIds: [MONARCH, AUDIO] }), MONARCH).venueIds, [AUDIO]);
  });
});

describe('posting a table', () => {
  const mine = business({ venueIds: [MONARCH] });

  const post = (over: Partial<Parameters<typeof postTable>[0]> = {}) =>
    postTable({
      id: asTableId('t1'),
      business: mine,
      venueId: MONARCH,
      name: 'Booth 5',
      seats: 6,
      perHeadMajorUnits: 40,
      currency: 'USD',
      vibe: 'House',
      ...over,
    });

  it('keeps the cents', () => {
    // $24.50 became $24 in the prototype, on a field labelled "Per head ($)".
    const result = post({ perHeadMajorUnits: 24.5 });
    assert.equal(result.ok, true);
    assert.deepEqual(result.ok && result.value.perHead, { amount: 2450, currency: 'USD' });
  });

  it('stores money as integer minor units', () => {
    const result = post({ perHeadMajorUnits: 40 });
    assert.equal(result.ok && Number.isInteger(result.value.perHead.amount), true);
    assert.equal(result.ok && result.value.perHead.amount, 4000);
  });

  it('treats a free table as zero, not as invalid', () => {
    const result = post({ perHeadMajorUnits: 0 });
    assert.equal(result.ok && result.value.perHead.amount, 0);
  });

  it('floors a negative price to zero rather than crediting the guest', () => {
    const result = post({ perHeadMajorUnits: -10 });
    assert.equal(result.ok && result.value.perHead.amount, 0);
  });

  it('refuses a venue the business does not run', () => {
    const result = post({ venueId: AUDIO });
    assert.equal(result.ok === false && result.error, 'not_your_venue');
  });

  it('refuses a table with no seats', () => {
    assert.equal(post({ seats: 0 }).ok, false);
    assert.equal(post({ seats: -3 }).ok, false);
  });

  it('falls back to a sensible name rather than an empty one', () => {
    const result = post({ name: '   ' });
    assert.equal(result.ok && result.value.name, 'Table');
  });
});
