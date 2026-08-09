import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { asPersonId, asVenueId, type PersonId } from '../ids';
import {
  LOCATION_FRESHNESS_MS,
  type LocationFix,
  type Presence,
  type PresenceProfile,
} from '../presence';
import {
  permits,
  venuePresence,
  visibleLocation,
  type PersonPresenceSnapshot,
  type Relationship,
  type SocialGraph,
} from '../visibility';

const NOW = Date.parse('2026-08-09T04:00:00Z'); // 9pm Saturday, Pacific
const VENUE = asVenueId('monarch');

const FIX: LocationFix = {
  at: { lat: 37.77, lon: -122.42 },
  recordedAt: NOW - 60_000,
  accuracyMetres: 10,
};

interface Opts {
  dtf?: boolean;
  casual?: boolean;
  mutuals?: boolean;
  fix?: LocationFix | null;
  expiresAt?: number;
}

function snapshot(id: string, opts: Opts = {}): PersonPresenceSnapshot {
  const expiresAt = opts.expiresAt ?? NOW + 3_600_000;
  let presence: Presence = { kind: 'off' };
  if (opts.dtf) presence = { kind: 'dtf', since: NOW - 3_600_000, expiresAt };
  else if (opts.casual) presence = { kind: 'casual', since: NOW - 3_600_000, expiresAt };

  const profile: PresenceProfile = {
    presence,
    shareWithMutuals: opts.mutuals ?? false,
  };
  return {
    id: asPersonId(id),
    profile,
    fix: opts.fix === undefined ? FIX : opts.fix,
  };
}

const see = (
  viewer: PersonPresenceSnapshot,
  subject: PersonPresenceSnapshot,
  rel: Relationship,
): string => visibleLocation(viewer, subject, rel, NOW).precision;

describe('friends see you when YOUR DTF is on', () => {
  it('shows an exact position to a friend when the subject is DTF', () => {
    assert.equal(see(snapshot('me'), snapshot('you', { dtf: true }), 'friend'), 'exact');
  });

  it('does not depend on the viewer’s own DTF', () => {
    // The viewer is not out at all and still sees their DTF friend.
    assert.equal(see(snapshot('me'), snapshot('you', { dtf: true }), 'friend'), 'exact');
  });

  it('hides a friend who is not DTF', () => {
    assert.equal(see(snapshot('me', { dtf: true }), snapshot('you'), 'friend'), 'none');
  });

  it('hides a friend who is only amber', () => {
    assert.equal(
      see(snapshot('me', { dtf: true }), snapshot('you', { casual: true }), 'friend'),
      'none',
    );
  });
});

describe('mutuals need all four switches — the full truth table', () => {
  it('grants on exactly one of sixteen combinations', () => {
    const rows: { granted: boolean; expected: boolean }[] = [];

    for (const viewerDtf of [false, true])
      for (const subjectDtf of [false, true])
        for (const viewerSetting of [false, true])
          for (const subjectSetting of [false, true]) {
            const precision = see(
              snapshot('me', { dtf: viewerDtf, mutuals: viewerSetting }),
              snapshot('you', { dtf: subjectDtf, mutuals: subjectSetting }),
              'mutual',
            );
            rows.push({
              granted: precision !== 'none',
              expected: viewerDtf && subjectDtf && viewerSetting && subjectSetting,
            });
            // Whatever else happens, a mutual never gets an exact position.
            assert.notEqual(precision, 'exact');
          }

    assert.equal(rows.length, 16);
    assert.equal(rows.filter((r) => r.granted).length, 1);
    for (const row of rows) assert.equal(row.granted, row.expected);
  });

  it('grants only presence, never a position', () => {
    const result = visibleLocation(
      snapshot('me', { dtf: true, mutuals: true }),
      snapshot('you', { dtf: true, mutuals: true }),
      'mutual',
      NOW,
    );
    assert.equal(result.precision, 'aggregate');
    // The safety property: the payload cannot carry coordinates.
    assert.equal('at' in result, false);
    assert.equal('recordedAt' in result, false);
  });

  it('still aggregates a mutual with no location fix at all', () => {
    // Mutual visibility is about presence, not position — a missing fix does
    // not remove someone from the count.
    assert.equal(
      see(
        snapshot('me', { dtf: true, mutuals: true }),
        snapshot('you', { dtf: true, mutuals: true, fix: null }),
        'mutual',
      ),
      'aggregate',
    );
  });
});

describe('everyone else sees nothing', () => {
  it('hides from a stranger even when both are fully opted in', () => {
    assert.equal(
      see(
        snapshot('me', { dtf: true, mutuals: true }),
        snapshot('you', { dtf: true, mutuals: true }),
        'none',
      ),
      'none',
    );
    assert.equal(
      permits(
        snapshot('me', { dtf: true, mutuals: true }),
        snapshot('you', { dtf: true, mutuals: true }),
        'none',
        NOW,
      ),
      false,
    );
  });
});

describe('expiry and staleness withhold location', () => {
  it('hides an expired friend', () => {
    assert.equal(
      see(snapshot('me'), snapshot('you', { dtf: true, expiresAt: NOW - 1 }), 'friend'),
      'none',
    );
  });

  it('hides an expired mutual', () => {
    assert.equal(
      see(
        snapshot('me', { dtf: true, mutuals: true }),
        snapshot('you', { dtf: true, mutuals: true, expiresAt: NOW - 1 }),
        'mutual',
      ),
      'none',
    );
  });

  it('withholds a stale fix rather than showing it as current', () => {
    const stale: LocationFix = { ...FIX, recordedAt: NOW - LOCATION_FRESHNESS_MS - 1 };
    assert.equal(see(snapshot('me'), snapshot('you', { dtf: true, fix: stale }), 'friend'), 'none');
  });

  it('rejects a fix dated in the future', () => {
    const skewed: LocationFix = { ...FIX, recordedAt: NOW + 60_000 };
    assert.equal(see(snapshot('me'), snapshot('you', { dtf: true, fix: skewed }), 'friend'), 'none');
  });

  it('shows you to yourself even while off', () => {
    assert.equal(see(snapshot('me'), snapshot('me'), 'self'), 'exact');
  });
});

describe('venue rollup keeps friends named and mutuals anonymous', () => {
  const graph: SocialGraph = {
    relationship: (_viewer: PersonId, subject: PersonId): Relationship =>
      subject.startsWith('f') ? 'friend' : subject.startsWith('m') ? 'mutual' : 'none',
    friendsOf: () => [],
  };

  const at = (id: string, opts: Opts) => ({ person: snapshot(id, opts), venueId: VENUE });
  const viewer = snapshot('me', { dtf: true, mutuals: true });

  it('names only DTF friends and counts only opted-in mutuals', () => {
    const view = venuePresence(
      viewer,
      [
        at('f1', { dtf: true }),
        at('f2', { dtf: true }),
        at('f3', { dtf: false }), // friend not out — invisible
        at('m1', { dtf: true, mutuals: true }),
        at('m2', { dtf: true, mutuals: true }),
        at('m3', { dtf: true, mutuals: false }), // opted out — invisible
        at('x1', { dtf: true, mutuals: true }), // stranger
      ],
      VENUE,
      graph,
      NOW,
    );

    assert.deepEqual(view.friends, [asPersonId('f1'), asPersonId('f2')]);
    assert.equal(view.mutualCount, 2);
  });

  it('exposes no mutual identities in the result shape', () => {
    const view = venuePresence(viewer, [at('m1', { dtf: true, mutuals: true })], VENUE, graph, NOW);
    assert.deepEqual(Object.keys(view).sort(), ['friends', 'mutualCount', 'venueId']);
  });

  it('suppresses a lone mutual, who would be identifiable by elimination', () => {
    const view = venuePresence(viewer, [at('m1', { dtf: true, mutuals: true })], VENUE, graph, NOW);
    assert.equal(view.mutualCount, 0);
  });

  it('ignores people at other venues', () => {
    const elsewhere = {
      person: snapshot('f9', { dtf: true }),
      venueId: asVenueId('audio'),
    };
    const view = venuePresence(viewer, [at('f1', { dtf: true }), elsewhere], VENUE, graph, NOW);
    assert.deepEqual(view.friends, [asPersonId('f1')]);
  });
});
