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
import type { ChatThread, Group, PoolInvite } from '@/domain/types';

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

  // inv_dinner: private but venue-anchored (v_kaimuki), hosted by Luca, Maya
  // neither host nor attendee/requester. Decision 017 §6.4 rule 3 / §7.8:
  // a venue-anchored invite resolves exact to the known public venue for
  // every audience, so this stays exact even though Maya is unrelated.
  const dinner = view.invites.find((c) => c.id === 'inv_dinner');
  assert.ok(dinner);
  assert.equal(dinner?.viewer.relation, 'none');
  assert.equal(dinner?.where.kind, 'exact');

  // inv_afters: private, unanchored (no venueId), hosted by Maya. Viewed from
  // Jun -- who has no tie to Maya or this invite at all -- an unanchored
  // private invite must stay area-only for an unrelated viewer.
  const juneView = viewFor({ ...buildSeed(NOW), currentUserId: 'u_jun' }, NOW);
  const afters = juneView.invites.find((c) => c.id === 'inv_afters');
  assert.ok(afters);
  assert.equal(afters?.viewer.relation, 'none');
  assert.notEqual(afters?.where.kind, 'exact');
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

test('when a business invite\'s verification is revoked, its pool thread is hidden from an affected participant', () => {
  const seed = buildSeed(NOW);
  const wren = seed.users.find((u) => u.id === 'u_wren')!;
  wren.businessProfile!.verification.status = 'unverified';

  // u_kai attended inv_audiowave and is a participant of thr_inv_audiowave --
  // revoking Wren's verification must fail closed for Kai too, not just for
  // unrelated viewers.
  const kaiView = viewFor({ ...seed, currentUserId: 'u_kai' }, NOW);
  assert.equal(kaiView.invites.some((i) => i.id === 'inv_audiowave'), false);
  assert.equal(kaiView.inviteDetails.has('inv_audiowave'), false);
  assert.equal(kaiView.threads.some((t) => t.id === 'thr_inv_audiowave'), false);
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

  // Stage 11 thread-integrity hardening: a thread with any unresolvable
  // participant group is hidden entirely, not shown with that participant
  // silently dropped from the list.
  assert.equal(view.threads.some((t) => t.id === 'thr_ghost'), false);
  assert.equal(view.people.has(ghostGroupId), false);
});

// ---------------------------------------------------------------------------
// Authored invite text disclosure (Stage 11, reviewer finding 1 / D4): the
// description is shown only to a viewer who already has an exact location
// disclosure -- everyone else gets the generic "Private plan" label.
// ---------------------------------------------------------------------------

test('a private invite\'s host and its accepted attendee both see the real authored description', () => {
  const snap = buildSeed(NOW);
  const realDescription = 'Afters at mine after Audiowave — rooftop, bring a jacket 🧥';

  const mayaView = viewFor(snap, NOW); // Maya hosts inv_afters (private, unanchored)
  const aftersAsHost = mayaView.invites.find((c) => c.id === 'inv_afters');
  assert.equal(aftersAsHost?.viewer.relation, 'host');
  assert.equal(aftersAsHost?.where.kind, 'exact');
  assert.equal(aftersAsHost?.description, realDescription);
  // InviteDetailView must carry the same disclosed description as the card.
  assert.equal(mayaView.inviteDetails.get('inv_afters')?.description, realDescription);

  const sashaView = viewFor({ ...snap, currentUserId: 'u_sasha' }, NOW); // Sasha is an accepted attendee
  const aftersAsAttendee = sashaView.invites.find((c) => c.id === 'inv_afters');
  assert.equal(aftersAsAttendee?.viewer.relation, 'attending');
  assert.equal(aftersAsAttendee?.where.kind, 'exact');
  assert.equal(aftersAsAttendee?.description, realDescription);
});

test('a pending requester, a denied requester, and an unrelated viewer all see the generic "Private plan" label on a private invite', () => {
  const snap = buildSeed(NOW);

  const theoView = viewFor({ ...snap, currentUserId: 'u_theo' }, NOW); // Theo is pending on inv_afters
  const aftersAsPending = theoView.invites.find((c) => c.id === 'inv_afters');
  assert.equal(aftersAsPending?.viewer.relation, 'requested');
  assert.notEqual(aftersAsPending?.where.kind, 'exact');
  assert.equal(aftersAsPending?.description, 'Private plan');

  const junView = viewFor({ ...snap, currentUserId: 'u_jun' }, NOW); // Jun has no tie to inv_afters at all
  const aftersAsUnrelated = junView.invites.find((c) => c.id === 'inv_afters');
  assert.equal(aftersAsUnrelated?.viewer.relation, 'none');
  assert.notEqual(aftersAsUnrelated?.where.kind, 'exact');
  assert.equal(aftersAsUnrelated?.description, 'Private plan');

  // Denied isn't seeded on any invite, so deny Theo's own pending request and
  // re-view as him.
  const denied: Snapshot = {
    ...snap,
    invites: snap.invites.map((i) =>
      i.id !== 'inv_afters'
        ? i
        : {
            ...i,
            requests: i.requests.map((r) =>
              r.requestingGroupId === 'g_theo' ? { ...r, status: 'denied' as const } : r,
            ),
          },
    ),
  };
  const theoDeniedView = viewFor({ ...denied, currentUserId: 'u_theo' }, NOW);
  const aftersAsDenied = theoDeniedView.invites.find((c) => c.id === 'inv_afters');
  assert.equal(aftersAsDenied?.viewer.relation, 'denied');
  assert.notEqual(aftersAsDenied?.where.kind, 'exact');
  assert.equal(aftersAsDenied?.description, 'Private plan');
});

test('a public venue-anchored invite keeps its real description for a totally unrelated outsider', () => {
  const junView = viewFor({ ...buildSeed(NOW), currentUserId: 'u_jun' }, NOW); // Jun: no tie to inv_karaoke
  const karaoke = junView.invites.find((c) => c.id === 'inv_karaoke');
  assert.equal(karaoke?.viewer.relation, 'none');
  assert.equal(karaoke?.access.mode, 'public');
  assert.equal(karaoke?.where.kind, 'exact');
  assert.equal(karaoke?.description, 'Private karaoke room on Nob Hill, 8 spots, we sing badly');
});

test('a hidden disclosure (e.g. an invalid location) also falls back to the generic label, never the authored text', () => {
  const seed = buildSeed(NOW);
  const brokenInvite: PoolInvite = {
    id: 'inv_broken_location',
    hostGroupId: 'g_luca',
    description: 'Should never be shown -- location is corrupt',
    location: { lat: Number.NaN, lng: -122.42 },
    capacity: { mode: 'uncapped' },
    access: { mode: 'private' },
    requests: [],
    attendeeGroupIds: ['g_luca'],
    groupChatId: 'thr_broken',
    createdByAccountType: 'personal',
    createdAt: NOW.toISOString(),
  };
  const malformed: Snapshot = { ...seed, invites: [...seed.invites, brokenInvite] };

  const view = viewFor(malformed, NOW);
  const card = view.invites.find((c) => c.id === 'inv_broken_location');
  assert.ok(card);
  assert.equal(card?.where.kind, 'hidden');
  assert.equal(card?.description, 'Private plan');
});

test('authority is named as simulated, never claimed as server-verified', () => {
  const view = viewFor(buildSeed(NOW), NOW);
  assert.equal(view.authority, 'simulated');
});

// ---------------------------------------------------------------------------
// Thread integrity (Stage 11 re-review blocker): a malformed ChatThread is
// hidden entirely, never rendered with a fabricated or partial identity.
// ---------------------------------------------------------------------------

test('a well-formed thread with valid participants and message senders remains visible', () => {
  const seed = buildSeed(NOW);
  const validThread: ChatThread = {
    id: 'thr_valid_custom',
    kind: 'dm',
    title: 'valid',
    participantGroupIds: ['g_maya', 'g_theo'],
    messages: [
      { id: 'm1', senderUserId: 'u_maya', text: 'hi', sentAt: NOW.toISOString() },
      { id: 'm2', senderUserId: 'u_theo', text: 'hey', sentAt: NOW.toISOString() },
    ],
  };
  const snap: Snapshot = { ...seed, threads: [...seed.threads, validThread] };

  const view = viewFor(snap, NOW);
  const thread = view.threads.find((t) => t.id === 'thr_valid_custom');
  assert.ok(thread);
  assert.equal(thread?.participants.length, 2);
  assert.deepEqual(thread?.messages.map((m) => m.senderId).sort(), ['u_maya', 'u_theo']);
  assert.ok(view.people.has('u_maya'));
  assert.ok(view.people.has('u_theo'));
});

test('a thread with any unresolvable participant group -- missing group, or a group whose lead does not resolve -- is hidden entirely', () => {
  const seed = buildSeed(NOW);

  const missingGroupThread: ChatThread = {
    id: 'thr_missing_group',
    kind: 'dm',
    title: 'missing group',
    participantGroupIds: ['g_maya', 'g_ghost_missing'],
    messages: [],
  };

  const brokenLeadGroup: Group = {
    id: 'g_broken_lead',
    leadUserId: 'u_ghost_missing',
    memberUserIds: ['u_ghost_missing'],
  };
  const brokenLeadThread: ChatThread = {
    id: 'thr_broken_lead',
    kind: 'dm',
    title: 'broken lead',
    participantGroupIds: ['g_maya', 'g_broken_lead'],
    messages: [],
  };

  const snap: Snapshot = {
    ...seed,
    groups: [...seed.groups, brokenLeadGroup],
    threads: [...seed.threads, missingGroupThread, brokenLeadThread],
  };

  const view = viewFor(snap, NOW);
  assert.equal(view.threads.some((t) => t.id === 'thr_missing_group'), false);
  assert.equal(view.threads.some((t) => t.id === 'thr_broken_lead'), false);
});

test('a thread with any unresolvable message sender is hidden entirely', () => {
  const seed = buildSeed(NOW);
  const missingSenderThread: ChatThread = {
    id: 'thr_missing_sender',
    kind: 'dm',
    title: 'missing sender',
    participantGroupIds: ['g_maya', 'g_theo'],
    messages: [{ id: 'm1', senderUserId: 'u_ghost_missing', text: 'hi', sentAt: NOW.toISOString() }],
  };
  const snap: Snapshot = { ...seed, threads: [...seed.threads, missingSenderThread] };

  const view = viewFor(snap, NOW);
  assert.equal(view.threads.some((t) => t.id === 'thr_missing_sender'), false);
});

test('a thread whose message sender is a real user but not a member of any participant group is hidden entirely', () => {
  const seed = buildSeed(NOW);
  // Luca is a real seeded user, but not a member of g_maya or g_theo.
  const foreignSenderThread: ChatThread = {
    id: 'thr_foreign_sender',
    kind: 'dm',
    title: 'foreign sender',
    participantGroupIds: ['g_maya', 'g_theo'],
    messages: [{ id: 'm1', senderUserId: 'u_luca', text: 'hi', sentAt: NOW.toISOString() }],
  };
  const snap: Snapshot = { ...seed, threads: [...seed.threads, foreignSenderThread] };

  const view = viewFor(snap, NOW);
  assert.equal(view.threads.some((t) => t.id === 'thr_foreign_sender'), false);
});

test('no malformed participant or sender identity leaks into people or any thread\'s messages', () => {
  const seed = buildSeed(NOW);
  const brokenLeadGroup: Group = {
    id: 'g_broken_lead_2',
    leadUserId: 'u_ghost_missing_2',
    memberUserIds: ['u_ghost_missing_2'],
  };
  const malformedThreads: ChatThread[] = [
    { id: 'thr_bad_1', kind: 'dm', title: 'a', participantGroupIds: ['g_maya', 'g_ghost_missing'], messages: [] },
    { id: 'thr_bad_2', kind: 'dm', title: 'b', participantGroupIds: ['g_maya', 'g_broken_lead_2'], messages: [] },
    {
      id: 'thr_bad_3',
      kind: 'dm',
      title: 'c',
      participantGroupIds: ['g_maya', 'g_theo'],
      messages: [{ id: 'm1', senderUserId: 'u_ghost_missing_3', text: 'hi', sentAt: NOW.toISOString() }],
    },
    {
      id: 'thr_bad_4',
      kind: 'dm',
      title: 'd',
      participantGroupIds: ['g_maya', 'g_theo'],
      messages: [{ id: 'm1', senderUserId: 'u_luca', text: 'hi', sentAt: NOW.toISOString() }],
    },
  ];
  const snap: Snapshot = {
    ...seed,
    groups: [...seed.groups, brokenLeadGroup],
    threads: [...seed.threads, ...malformedThreads],
  };

  const view = viewFor(snap, NOW);

  for (const bad of malformedThreads) {
    assert.equal(view.threads.some((t) => t.id === bad.id), false, `${bad.id} must be hidden`);
  }
  // (thr_bad_1's bad id, g_ghost_missing, is a *group* id -- people only
  // ever holds resolved user ids via addPerson, so it was never a candidate
  // for leaking in here; the real regression risk is a user id, checked
  // below for the other three malformed threads.)
  assert.equal(view.people.has('u_ghost_missing_2'), false);
  assert.equal(view.people.has('u_ghost_missing_3'), false);

  // Every message senderId across every VISIBLE thread must be a person the
  // view actually knows about -- no orphaned/fabricated sender ids leak
  // through on a thread that otherwise passed validation.
  for (const t of view.threads) {
    for (const m of t.messages) {
      assert.ok(view.people.has(m.senderId), `${t.id}'s message ${m.id} has an unknown senderId ${m.senderId}`);
    }
  }
});
