/*
 * Runtime verification of the presence + visibility rules.
 *
 * WHY THIS EXISTS: Node is not installed on this machine, so the TypeScript in
 * src/domain cannot be compiled or unit-tested yet. This file is a line-for-line
 * transcription of the pure logic in src/domain/presence.ts and
 * src/domain/visibility.ts into plain JavaScript, so the rules can be executed
 * and checked in a real runtime today.
 *
 * It is a stopgap, not a shipping artifact. Once Node is installed this is
 * deleted and replaced by real tests against the TypeScript itself. Any change
 * to the rules must be made in the TypeScript first.
 *
 * Transcription rule: below the divider, the code is identical to the domain
 * source with type annotations removed. Nothing else differs.
 */

/* ===== transcribed from src/domain/presence.ts ============================ */

function zonedParts(ts, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(ts));
  const value = (type) => {
    const found = parts.find((p) => p.type === type);
    return found ? Number(found.value) : 0;
  };
  return {
    year: value('year'), month: value('month'), day: value('day'),
    hour: value('hour') % 24, minute: value('minute'), second: value('second'),
  };
}

function offsetAt(ts, timeZone) {
  const p = zonedParts(ts, timeZone);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asIfUtc - Math.floor(ts / 1000) * 1000;
}

function zonedTimeToUtc(parts, timeZone) {
  const naive = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const firstPass = naive - offsetAt(naive, timeZone);
  return naive - offsetAt(firstPass, timeZone);
}

function nextLocalNoon(now, timeZone) {
  const local = zonedParts(now, timeZone);
  let { year, month, day } = local;
  if (local.hour >= 12) {
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() + 1);
    year = d.getUTCFullYear(); month = d.getUTCMonth() + 1; day = d.getUTCDate();
  }
  return zonedTimeToUtc({ year, month, day, hour: 12, minute: 0, second: 0 }, timeZone);
}

const OFF = { kind: 'off' };

function resolvePresence(presence, now) {
  if (presence.kind === 'off') return presence;
  return now >= presence.expiresAt ? OFF : presence;
}

function isDtf(profile, now) {
  return resolvePresence(profile.presence, now).kind === 'dtf';
}

function withExpiry(presence, expiresAt, now) {
  if (presence.kind === 'off') return presence;
  if (expiresAt <= now) return OFF;
  return { ...presence, expiresAt };
}

const LOCATION_FRESHNESS_MS = 20 * 60 * 1000;

function isFresh(fix, now, maxAgeMs = LOCATION_FRESHNESS_MS) {
  const age = now - fix.recordedAt;
  return age >= 0 && age <= maxAgeMs;
}

/* ===== transcribed from src/domain/visibility.ts ========================== */

const HIDDEN = { precision: 'none' };
const AGGREGATE = { precision: 'aggregate' };
const MIN_MUTUALS_TO_DISPLAY = 2;

function permits(viewer, subject, relationship, now) {
  switch (relationship) {
    case 'self': return true;
    case 'friend': return isDtf(subject.profile, now);
    case 'mutual':
      return (
        subject.profile.shareWithMutuals &&
        viewer.profile.shareWithMutuals &&
        isDtf(subject.profile, now) &&
        isDtf(viewer.profile, now)
      );
    case 'none': return false;
    default: return false;
  }
}

function visibleLocation(viewer, subject, relationship, now) {
  if (relationship === 'self' || viewer.id === subject.id) {
    return subject.fix && isFresh(subject.fix, now)
      ? { precision: 'exact', at: subject.fix.at, recordedAt: subject.fix.recordedAt }
      : HIDDEN;
  }
  if (!permits(viewer, subject, relationship, now)) return HIDDEN;
  if (relationship === 'mutual') return AGGREGATE;
  if (!subject.fix || !isFresh(subject.fix, now)) return HIDDEN;
  return { precision: 'exact', at: subject.fix.at, recordedAt: subject.fix.recordedAt };
}

function venuePresence(viewer, peopleAtVenue, venueId, graph, now) {
  const friends = [];
  let mutuals = 0;
  for (const entry of peopleAtVenue) {
    if (entry.venueId !== venueId) continue;
    if (entry.person.id === viewer.id) continue;
    const rel = graph.relationship(viewer.id, entry.person.id);
    const seen = visibleLocation(viewer, entry.person, rel, now);
    if (seen.precision === 'exact') friends.push(entry.person.id);
    else if (seen.precision === 'aggregate') mutuals += 1;
  }
  return { venueId, friends, mutualCount: mutuals >= MIN_MUTUALS_TO_DISPLAY ? mutuals : 0 };
}

/* ===== test harness ======================================================= */

const results = [];
function check(name, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ name, pass, actual, expected });
}

const NOW = Date.parse('2026-08-09T04:00:00Z'); // 9pm Sat PDT / 04:00 Sun UTC
const FIX = { at: { lat: 37.77, lon: -122.42 }, recordedAt: NOW - 60_000, accuracyMetres: 10 };

function person(id, { dtf = false, casual = false, mutuals = false, fix = FIX, expiresAt = NOW + 3600_000 } = {}) {
  let presence = OFF;
  if (dtf) presence = { kind: 'dtf', since: NOW - 3600_000, expiresAt };
  else if (casual) presence = { kind: 'casual', since: NOW - 3600_000, expiresAt };
  return { id, profile: { presence, shareWithMutuals: mutuals }, fix };
}

// --- 1. Friend visibility depends only on the subject's DTF ---------------
check('friend sees DTF friend (exact)',
  visibleLocation(person('me'), person('you', { dtf: true }), 'friend', NOW).precision, 'exact');
check('friend cannot see non-DTF friend',
  visibleLocation(person('me', { dtf: true }), person('you'), 'friend', NOW).precision, 'none');
check('friend cannot see casual/amber friend',
  visibleLocation(person('me', { dtf: true }), person('you', { casual: true }), 'friend', NOW).precision, 'none');
check("viewer's own DTF is irrelevant for friends",
  visibleLocation(person('me'), person('you', { dtf: true }), 'friend', NOW).precision, 'exact');

// --- 2. Mutuals: full 16-row truth table ----------------------------------
const table = [];
for (const vDtf of [false, true])
  for (const sDtf of [false, true])
    for (const vSet of [false, true])
      for (const sSet of [false, true]) {
        const got = visibleLocation(
          person('me', { dtf: vDtf, mutuals: vSet }),
          person('you', { dtf: sDtf, mutuals: sSet }),
          'mutual', NOW,
        ).precision;
        const want = (vDtf && sDtf && vSet && sSet) ? 'aggregate' : 'none';
        table.push({ vDtf, sDtf, vSet, sSet, got, want, ok: got === want });
      }
check('mutual truth table: 16/16 rows correct',
  table.filter((r) => r.ok).length, 16);
check('mutual truth table: exactly one row grants visibility',
  table.filter((r) => r.got === 'aggregate').length, 1);
check('mutual NEVER gets exact precision (any row)',
  table.filter((r) => r.got === 'exact').length, 0);

// --- 3. Strangers -----------------------------------------------------------
check('stranger sees nothing even when both DTF + both settings on',
  visibleLocation(person('me', { dtf: true, mutuals: true }), person('you', { dtf: true, mutuals: true }), 'none', NOW).precision, 'none');

// --- 4. Aggregate result carries no coordinates ------------------------------
const agg = visibleLocation(person('me', { dtf: true, mutuals: true }), person('you', { dtf: true, mutuals: true }), 'mutual', NOW);
check('aggregate result has no `at` field', Object.prototype.hasOwnProperty.call(agg, 'at'), false);
check('aggregate result has no `recordedAt` field', Object.prototype.hasOwnProperty.call(agg, 'recordedAt'), false);

// --- 5. Expiry hides location ------------------------------------------------
const expired = person('you', { dtf: true, expiresAt: NOW - 1 });
check('expired DTF hides location from a friend',
  visibleLocation(person('me'), expired, 'friend', NOW).precision, 'none');
check('expired DTF hides location from a mutual',
  visibleLocation(person('me', { dtf: true, mutuals: true }), person('you', { dtf: true, mutuals: true, expiresAt: NOW - 1 }), 'mutual', NOW).precision, 'none');
check('DTF one ms before expiry is still visible',
  visibleLocation(person('me'), person('you', { dtf: true, expiresAt: NOW + 1 }), 'friend', NOW).precision, 'exact');

// --- 6. Stale / missing fixes -----------------------------------------------
check('stale fix withheld from a friend',
  visibleLocation(person('me'), person('you', { dtf: true, fix: { ...FIX, recordedAt: NOW - 21 * 60_000 } }), 'friend', NOW).precision, 'none');
check('missing fix withheld from a friend',
  visibleLocation(person('me'), person('you', { dtf: true, fix: null }), 'friend', NOW).precision, 'none');
check('future-dated fix treated as not fresh',
  visibleLocation(person('me'), person('you', { dtf: true, fix: { ...FIX, recordedAt: NOW + 60_000 } }), 'friend', NOW).precision, 'none');
check('mutual still aggregates with NO fix at all (presence, not position)',
  visibleLocation(person('me', { dtf: true, mutuals: true }), person('you', { dtf: true, mutuals: true, fix: null }), 'mutual', NOW).precision, 'aggregate');

// --- 7. Self ----------------------------------------------------------------
check('you see yourself while off', visibleLocation(person('me'), person('me'), 'self', NOW).precision, 'exact');

// --- 8. DTF expiry lands on the next local noon -----------------------------
const TZ = 'America/Los_Angeles';
const noonOf = (iso) => new Date(nextLocalNoon(Date.parse(iso), TZ)).toISOString();
check('9pm Fri PDT  -> Sat 12:00 PDT (19:00Z)', noonOf('2026-08-07T21:00:00-07:00'), '2026-08-08T19:00:00.000Z');
check('1am Sat PDT  -> Sat 12:00 PDT (same night)', noonOf('2026-08-08T01:00:00-07:00'), '2026-08-08T19:00:00.000Z');
check('11am Sat PDT -> Sat 12:00 PDT (1h, known edge)', noonOf('2026-08-08T11:00:00-07:00'), '2026-08-08T19:00:00.000Z');
check('12:00 exactly -> next day noon', noonOf('2026-08-08T12:00:00-07:00'), '2026-08-09T19:00:00.000Z');
check('11:59pm Sat   -> Sun 12:00 PDT', noonOf('2026-08-08T23:59:00-07:00'), '2026-08-09T19:00:00.000Z');
// DST: PST->PDT spring forward is 2026-03-08. A Sat-night session crosses it.
check('night crossing spring-forward -> Sun 12:00 PDT (19:00Z)',
  noonOf('2026-03-07T22:00:00-08:00'), '2026-03-08T19:00:00.000Z');
// DST: PDT->PST fall back is 2026-11-01.
check('night crossing fall-back -> Sun 12:00 PST (20:00Z)',
  noonOf('2026-10-31T22:00:00-07:00'), '2026-11-01T20:00:00.000Z');
// A different zone entirely — the model must not assume the Americas.
check('Berlin 2am -> Berlin 12:00 CEST (10:00Z)',
  new Date(nextLocalNoon(Date.parse('2026-08-08T02:00:00+02:00'), 'Europe/Berlin')).toISOString(),
  '2026-08-08T10:00:00.000Z');
check('Tokyo 11pm -> next-day 12:00 JST (03:00Z)',
  new Date(nextLocalNoon(Date.parse('2026-08-08T23:00:00+09:00'), 'Asia/Tokyo')).toISOString(),
  '2026-08-09T03:00:00.000Z');

// --- 9. Manual override ------------------------------------------------------
const live = { kind: 'dtf', since: NOW, expiresAt: NOW + 3600_000 };
check('user can end DTF early by setting a past expiry',
  withExpiry(live, NOW - 1, NOW).kind, 'off');
check('user can extend DTF', withExpiry(live, NOW + 7200_000, NOW).expiresAt, NOW + 7200_000);

// --- 10. Venue rollup --------------------------------------------------------
const graph = {
  relationship: (v, s) => (s.startsWith('f') ? 'friend' : s.startsWith('m') ? 'mutual' : 'none'),
  friendsOf: () => [],
};
const viewer = person('me', { dtf: true, mutuals: true });
const at = (id, opts) => ({ person: person(id, opts), venueId: 'monarch' });
const roll = venuePresence(viewer, [
  at('f1', { dtf: true }),
  at('f2', { dtf: true }),
  at('f3', { dtf: false }),               // friend not DTF -> invisible
  at('m1', { dtf: true, mutuals: true }),
  at('m2', { dtf: true, mutuals: true }),
  at('m3', { dtf: true, mutuals: false }), // mutual opted out -> invisible
  at('x1', { dtf: true, mutuals: true }),  // stranger
], 'monarch', graph, NOW);
check('venue: only DTF friends are named', roll.friends, ['f1', 'f2']);
check('venue: only opted-in mutuals counted', roll.mutualCount, 2);
check('venue: no mutual ids exposed anywhere', Object.keys(roll).sort(), ['friends', 'mutualCount', 'venueId']);

// A single mutual must not be shown — one is identifiable by elimination.
const rollOne = venuePresence(viewer, [at('m1', { dtf: true, mutuals: true })], 'monarch', graph, NOW);
check('venue: a lone mutual is suppressed', rollOne.mutualCount, 0);

/* ===== report ============================================================= */

const failed = results.filter((r) => !r.pass);
window.__RULES_RESULT__ = {
  total: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  failures: failed,
  mutualTable: table,
};
