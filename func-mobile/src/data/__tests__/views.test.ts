// Stage 4B: runtime privacy assertions for `viewFor` (Decision 017, spec section 7).
// `views.types.test.ts` (Stage 4A) already locks the *shapes*; this file locks
// the *behavior* -- that the projection actually withholds what an audience
// isn't entitled to, on real seed data. Expected to fail until `viewFor` is
// implemented (Stage 4 Step 5).
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSeed } from '../seed';
import { viewFor } from '../views';
import type { Snapshot } from '../repository';
import type { ChatThread, PoolInvite } from '@/domain/types';

const NOW = new Date('2026-08-23T20:00:00.000Z'); // matches the seed's "live as of now" liveStatusSince values

test('an unrelated viewer sees only whitelisted invite fields, never an exact coordinate on a private invite they are not party to', () => {
  const view = viewFor(buildSeed(NOW), NOW); // Maya

  for (const card of view.invites) {
    assert.equal('requests' in card, false);
    assert.equal('hostGroupId' in card, false);
    assert.equal('attendeeGroupIds' in card, false);
    assert.equal('groupChatId' in card, false);
    assert.equal('location' in card, false);
    assert.equal('createdByAccountType' in card, false);
  }

  // inv_dinner: private, hosted by Luca, Maya neither host nor attendee/requester.
  const dinner = view.invites.find((c) => c.id === 'inv_dinner');
  assert.ok(dinner);
  assert.equal(dinner?.viewer.relation, 'none');
  assert.notEqual(dinner?.where.kind, 'exact');
});

test('people is sparse and justified -- never every seeded user', () => {
  const snap = buildSeed(NOW);
  const juneView = viewFor({ ...snap, currentUserId: 'u_jun' }, NOW); // Jun has zero friendship edges

  assert.ok(juneView.people.size > 0);
  assert.ok(juneView.people.size < snap.users.length);
  assert.ok(juneView.people.has('u_jun')); // self is always present
  // No invite/thread/friendship/business tie to Jun -- must not be leaked in.
  assert.equal(juneView.people.has('u_dev'), false);
});

test('a host sees their own pending review; a non-host sees none for that invite', () => {
  const view = viewFor(buildSeed(NOW), NOW); // Maya

  const afters = view.inviteDetails.get('inv_afters'); // Maya hosts this
  assert.equal(afters?.viewer.relation, 'host');
  assert.equal(afters?.review?.pending.length, 3); // theo, noor, dev
  assert.equal(afters?.review?.decided.length, 1); // sasha, seeded as an accepted attendee

  const crawl = view.inviteDetails.get('inv_crawl'); // Maya attends, Noor hosts
  assert.equal(crawl?.viewer.relation, 'attending');
  assert.equal(crawl?.review, undefined);
});

test('an accepted attendee sees the plan; a pending requester does not, but sees their own request', () => {
  const snap = buildSeed(NOW);

  const mayaView = viewFor(snap, NOW); // Maya is an accepted attendee of inv_crawl
  const crawl = mayaView.inviteDetails.get('inv_crawl');
  assert.equal(crawl?.viewer.relation, 'attending');
  assert.ok(crawl?.plan);
  assert.equal(crawl?.plan?.inviteId, 'inv_crawl');
  assert.equal(crawl?.plan?.threadId, 'thr_inv_crawl');

  const theoView = viewFor({ ...snap, currentUserId: 'u_theo' }, NOW); // Theo is pending on Maya's inv_afters
  const afters = theoView.inviteDetails.get('inv_afters');
  assert.equal(afters?.viewer.relation, 'requested');
  assert.equal(afters?.plan, undefined);
  assert.equal(afters?.viewer.ownRequest?.status, 'pending');
  assert.equal(afters?.viewer.ownRequest?.partySize, 2);
});

test('threads and messages are limited to threads the viewer\'s own party participates in', () => {
  const view = viewFor(buildSeed(NOW), NOW); // Maya

  const ids = view.threads.map((t) => t.id);
  assert.ok(ids.includes('thr_dm_priya')); // Maya's DM
  assert.ok(ids.includes('thr_inv_afters')); // Maya hosts
  assert.ok(ids.includes('thr_inv_crawl')); // Maya attends
  assert.equal(ids.includes('thr_inv_karaoke'), false); // Priya's invite, Maya not attending

  for (const t of view.threads) {
    assert.ok(t.participants.some((p) => p.id === view.self.id));
  }
});

test('an invite hosted by a business whose verification is revoked is hidden entirely', () => {
  const seed = buildSeed(NOW);
  const wren = seed.users.find((u) => u.id === 'u_wren')!;
  wren.businessProfile!.verification.status = 'unverified';

  const view = viewFor(seed, NOW);
  assert.equal(view.invites.some((i) => i.id === 'inv_audiowave'), false);
  assert.equal(view.invites.some((i) => i.host.displayName === 'Audiowave'), false);
});

test('an unresolved reference fails closed -- no crash, no fabricated identity', () => {
  const seed = buildSeed(NOW);
  const ghostGroupId = 'g_ghost_missing';

  const ghostInvite: PoolInvite = {
    id: 'inv_ghost',
    hostGroupId: ghostGroupId,
    description: 'Should never render a fabricated host',
    location: { lat: 37.76, lng: -122.42 },
    capacity: { mode: 'uncapped' },
    access: { mode: 'private' },
    requests: [],
    attendeeGroupIds: [ghostGroupId],
    groupChatId: 'thr_ghost',
    createdByAccountType: 'personal',
    createdAt: NOW.toISOString(),
  };
  const ghostThread: ChatThread = {
    id: 'thr_ghost',
    kind: 'dm',
    title: 'ghost',
    participantGroupIds: ['g_maya', ghostGroupId], // one resolvable, one dangling
    messages: [],
  };
  const malformed: Snapshot = {
    ...seed,
    invites: [...seed.invites, ghostInvite],
    threads: [...seed.threads, ghostThread],
  };

  assert.doesNotThrow(() => viewFor(malformed, NOW));
  const view = viewFor(malformed, NOW);

  const ghostCard = view.invites.find((c) => c.id === 'inv_ghost');
  assert.ok(ghostCard);
  assert.equal(ghostCard?.host.id, 'unknown');
  assert.notEqual(ghostCard?.where.kind, 'exact');

  const ghostThreadView = view.threads.find((t) => t.id === 'thr_ghost');
  assert.ok(ghostThreadView);
  assert.ok(ghostThreadView?.participants.every((p) => p.id !== ghostGroupId));
});

test('authority is named as simulated, never claimed as server-verified', () => {
  const view = viewFor(buildSeed(NOW), NOW);
  assert.equal(view.authority, 'simulated');
});
