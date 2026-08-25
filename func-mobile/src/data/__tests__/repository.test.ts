import assert from 'node:assert/strict';
import { test } from 'node:test';
import { InMemoryRepository } from '../InMemoryRepository';
import { buildSeed } from '../seed';
import { livePinFor, isPresenceLive, nextLocalNoon } from '../../domain/liveStatus';
import { isFull, pendingRequests, relationTo, seatsLeft } from '../../domain/pool';
import { hostedInvitesWithPending, myGroup, partySizeOf } from '../selectors';

const NOW = new Date('2026-08-21T22:00:00Z');
const fresh = () => new InMemoryRepository(buildSeed, { now: () => NOW });

test('seed covers all four capacity/access combinations', () => {
  const s = fresh().getSnapshot();
  const combos = new Set(s.invites.map((i) => `${i.capacity.mode}/${i.access.mode}`));
  assert.deepEqual(
    [...combos].sort(),
    ['capped/private', 'capped/public', 'uncapped/private', 'uncapped/public'],
  );
  assert.ok(s.venues.length >= 15 && s.venues.length <= 25);
  assert.ok(s.users.length >= 10 && s.users.length <= 15);
});

test('inbox has batched pending requests on first launch, incl. a pre-accept message', () => {
  const s = fresh().getSnapshot();
  const batches = hostedInvitesWithPending(s);
  assert.ok(batches.length >= 1);
  const withMsg = s.invites.flatMap((i) => i.requests).filter((r) => r.status === 'pending' && r.preAcceptMessage);
  assert.ok(withMsg.length >= 1);
});

test('every invite has a group chat; private chats contain only accepted groups', () => {
  const s = fresh().getSnapshot();
  for (const inv of s.invites) {
    const chat = s.threads.find((t) => t.id === inv.groupChatId);
    if (!chat) throw new Error(`chat missing for ${inv.id}`);
    assert.deepEqual([...chat.participantGroupIds].sort(), [...inv.attendeeGroupIds].sort());
    if (inv.access.mode === 'private') {
      for (const r of pendingRequests(inv)) {
        assert.ok(!chat.participantGroupIds.includes(r.requestingGroupId));
      }
    }
  }
});

test('public join is immediate and adds you to the chat; respects the cap', () => {
  const repo = fresh();
  const gid = myGroup(repo.getSnapshot()).id;
  assert.equal(repo.joinInvite('inv_warehouse', 2).ok, true);
  let s = repo.getSnapshot();
  const inv = s.invites.find((i) => i.id === 'inv_warehouse')!;
  assert.equal(relationTo(inv, gid), 'attending');
  assert.ok(s.threads.find((t) => t.id === inv.groupChatId)!.participantGroupIds.includes(gid));

  // kickback is full (4 max, 2+2 attending)
  const full = repo.joinInvite('inv_kickback', 1);
  assert.equal(full.ok, false);

  // karaoke has 3 left: a party of 4 is refused, a party of 3 fits
  assert.equal(repo.joinInvite('inv_karaoke', 4).ok, false);
  assert.equal(repo.joinInvite('inv_karaoke', 3).ok, true);
  s = repo.getSnapshot();
  assert.equal(seatsLeft(s.invites.find((i) => i.id === 'inv_karaoke')!, partySizeOf(s)), 0);
});

test('private invite: request stays pending until host reviews; message delivered on accept', () => {
  const repo = fresh();
  assert.equal(repo.joinInvite('inv_dinner', 1).ok, false, 'cannot walk into a private invite');
  assert.equal(repo.requestToJoin('inv_dinner', 2, 'we know Luca from uni').ok, true);
  let s = repo.getSnapshot();
  const gid = myGroup(s).id;
  let inv = s.invites.find((i) => i.id === 'inv_dinner')!;
  assert.equal(relationTo(inv, gid), 'requested');
  const req = inv.requests.find((r) => r.requestingGroupId === gid)!;
  assert.equal(req.status, 'pending');
  assert.equal(req.preAcceptMessage?.messageRequestStatus, 'pending');
  assert.ok(!s.threads.find((t) => t.id === inv.groupChatId)!.participantGroupIds.includes(gid));

  // Host (me) reviews a batch on my own invite
  const before = repo.getSnapshot().threads.find((t) => t.id === 'thr_inv_afters')!.messages.length;
  assert.equal(repo.reviewRequest('inv_afters', 'g_theo', 'accepted').ok, true);
  assert.equal(repo.reviewRequest('inv_afters', 'g_dev', 'denied').ok, true);
  s = repo.getSnapshot();
  inv = s.invites.find((i) => i.id === 'inv_afters')!;
  const theo = inv.requests.find((r) => r.requestingGroupId === 'g_theo')!;
  assert.equal(theo.status, 'accepted');
  assert.equal(theo.preAcceptMessage?.messageRequestStatus, 'accepted');
  assert.ok(inv.attendeeGroupIds.includes('g_theo'));
  assert.ok(!inv.attendeeGroupIds.includes('g_dev'));
  const chat = s.threads.find((t) => t.id === 'thr_inv_afters')!;
  assert.ok(chat.participantGroupIds.includes('g_theo'));
  assert.ok(!chat.participantGroupIds.includes('g_dev'));
  assert.equal(chat.messages.length, before + 1);
  assert.equal(chat.messages[chat.messages.length - 1]!.text, "we're bringing drinks 🍾");
  // one left pending in the batch
  assert.equal(pendingRequests(inv).length, 1);
});

test('host cannot accept past the cap', () => {
  const repo = fresh();
  // afters: max 12, sasha(2) attending. accept noor(3), theo(2) -> 7 taken, 5 left.
  repo.reviewRequest('inv_afters', 'g_noor', 'accepted');
  repo.reviewRequest('inv_afters', 'g_theo', 'accepted');
  const s = repo.getSnapshot();
  const inv = s.invites.find((i) => i.id === 'inv_afters')!;
  assert.equal(seatsLeft(inv, partySizeOf(s)), 5);
  assert.equal(isFull(inv, partySizeOf(s), 6), true);
});

test('business profile removes live status; switching back restores access', () => {
  const repo = fresh();
  assert.equal(repo.setLiveStatus('dtf').ok, true);
  assert.equal(repo.switchProfile('business').ok, true);
  let me = repo.getSnapshot().users.find((u) => u.id === 'u_maya')!;
  assert.equal(me.activeProfile, 'business');
  assert.equal(me.personalProfile.liveStatus, 'off');
  assert.equal(repo.setLiveStatus('dtf').ok, false);
  const pin = livePinFor(me, repo.getSnapshot().venues, NOW);
  assert.equal(pin?.kind, 'business');
  assert.equal(repo.switchProfile('personal').ok, true);
  assert.equal(repo.setLiveStatus('casual').ok, true);
  me = repo.getSnapshot().users.find((u) => u.id === 'u_maya')!;
  assert.equal(me.personalProfile.liveStatus, 'casual');
});

test('live pins: off fades after 48h, premium never auto-sets dtf', () => {
  const s = fresh().getSnapshot();
  const felix = s.users.find((u) => u.id === 'u_felix')!;
  assert.equal(livePinFor(felix, s.venues, NOW), null);
  const jun = s.users.find((u) => u.id === 'u_jun')!;
  const junPin = livePinFor(jun, s.venues, NOW);
  assert.equal(junPin?.kind, 'personal');
  if (junPin?.kind === 'personal') {
    assert.equal(junPin.status, 'off');
    assert.equal(junPin.elapsedHours, 20);
  }
  const premiumOff = s.users.filter((u) => u.personalProfile.premium && u.personalProfile.liveStatus !== 'dtf');
  assert.ok(premiumOff.length >= 1, 'premium is a skin, not a status');
});

test('creating an invite auto-creates its chat; reset returns to pristine', () => {
  const repo = fresh();
  const count = repo.getSnapshot().invites.length;
  const result = repo.createInvite({
    description: 'test',
    venueId: 'v_lantern',
    capacity: { mode: 'capped', max: 5 },
    access: { mode: 'public' },
  });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('expected ok');
  const s = repo.getSnapshot();
  assert.equal(s.invites.length, count + 1);
  const inv = s.invites.find((i) => i.id === result.inviteId)!;
  assert.ok(s.threads.find((t) => t.id === inv.groupChatId && t.poolInviteId === inv.id));
  repo.reset();
  assert.equal(repo.getSnapshot().invites.length, count);
});

test('createInvite gates: unverified business, public without venueId, missing location', () => {
  const repo = fresh();

  repo.switchProfile('business');
  const unverified = repo.createInvite({
    description: 'biz event',
    venueId: 'v_lantern',
    capacity: { mode: 'uncapped' },
    access: { mode: 'public' },
  });
  assert.equal(unverified.ok, false);
  if (unverified.ok) throw new Error('expected failure');
  assert.match(unverified.reason, /verified/);
  repo.switchProfile('personal');

  const noVenue = repo.createInvite({
    description: 'open invite, no venue',
    capacity: { mode: 'uncapped' },
    access: { mode: 'public' },
  });
  assert.deepEqual(noVenue, {
    ok: false,
    reason: 'Open invites must be at a listed venue -- private places need a private invite.',
  });

  const noLocation = repo.createInvite({
    description: 'private, no location',
    capacity: { mode: 'uncapped' },
    access: { mode: 'private' },
  });
  assert.deepEqual(noLocation, { ok: false, reason: 'Pin a location.' });
});

test('createInvite: public with an unknown venueId gets the open-invite reason, not "Pin a location."', () => {
  const repo = fresh();
  const result = repo.createInvite({
    description: 'open invite, bogus venue',
    venueId: 'v_does_not_exist',
    capacity: { mode: 'uncapped' },
    access: { mode: 'public' },
  });
  assert.deepEqual(result, {
    ok: false,
    reason: 'Open invites must be at a listed venue -- private places need a private invite.',
  });
});

test('createInvite: private location must be finite, in-range coordinates', () => {
  const repo = fresh();
  const cases = [
    { lat: NaN, lng: -122.42 },
    { lat: 37.76, lng: Infinity },
    { lat: 91, lng: -122.42 },
    { lat: 37.76, lng: 181 },
    { lat: -91, lng: -122.42 },
    { lat: 37.76, lng: -181 },
  ];
  for (const location of cases) {
    const result = repo.createInvite({
      description: 'private, bad location',
      location,
      capacity: { mode: 'uncapped' },
      access: { mode: 'private' },
    });
    assert.deepEqual(result, { ok: false, reason: 'Pin a location.' }, JSON.stringify(location));
  }

  const valid = repo.createInvite({
    description: 'private, valid location',
    location: { lat: 37.76, lng: -122.42 },
    capacity: { mode: 'uncapped' },
    access: { mode: 'private' },
  });
  assert.equal(valid.ok, true);
});

test('off clears the fix; re-enabling live republishes the seeded device fix', () => {
  const repo = fresh();
  assert.equal(repo.setLiveStatus('off').ok, true);
  let me = repo.getSnapshot().users.find((u) => u.id === 'u_maya')!;
  assert.equal(me.personalProfile.lastKnownLocation, undefined);

  assert.equal(repo.setLiveStatus('dtf').ok, true);
  me = repo.getSnapshot().users.find((u) => u.id === 'u_maya')!;
  assert.ok(me.personalProfile.lastKnownLocation);
  assert.equal(me.personalProfile.lastKnownLocation!.lat, 37.7601);
  assert.equal(me.personalProfile.lastKnownLocation!.lng, -122.4201);
});

test('setLiveStatus clears liveStatusSince/liveStatusExpiresAt on off, and stamps a fresh absolute expiry on enable', () => {
  const repo = fresh();
  assert.equal(repo.setLiveStatus('off').ok, true);
  let me = repo.getSnapshot().users.find((u) => u.id === 'u_maya')!;
  assert.equal(me.personalProfile.liveStatusSince, undefined);
  assert.equal(me.personalProfile.liveStatusExpiresAt, undefined);
  assert.equal(isPresenceLive(me.personalProfile, NOW), false);

  assert.equal(repo.setLiveStatus('dtf').ok, true);
  me = repo.getSnapshot().users.find((u) => u.id === 'u_maya')!;
  assert.equal(me.personalProfile.liveStatusSince, NOW.toISOString());
  assert.equal(me.personalProfile.liveStatusExpiresAt, nextLocalNoon(NOW).toISOString());
  assert.equal(isPresenceLive(me.personalProfile, NOW), true);
});

test('switching to business clears the personal fix and live-status timestamps', () => {
  const repo = fresh();
  const me = repo.getSnapshot().users.find((u) => u.id === 'u_maya')!;
  assert.equal(me.personalProfile.liveStatus, 'casual', 'sanity: Maya seeds live so this exercises a real clear');
  assert.equal(repo.switchProfile('business').ok, true);
  const after = repo.getSnapshot().users.find((u) => u.id === 'u_maya')!;
  assert.equal(after.personalProfile.lastKnownLocation, undefined);
  assert.equal(after.personalProfile.liveStatusSince, undefined);
  assert.equal(after.personalProfile.liveStatusExpiresAt, undefined);
});

test('createInvite: a venue-anchored invite fails closed when the venue has invalid coordinates, never anchors to it', () => {
  const seedWithBadVenue = (now: Date) => {
    const s = buildSeed(now);
    return {
      ...s,
      venues: s.venues.map((v) => (v.id === 'v_lantern' ? { ...v, location: { lat: Number.NaN, lng: -122.42 } } : v)),
    };
  };
  const repo = new InMemoryRepository(seedWithBadVenue, { now: () => NOW });
  const before = repo.getSnapshot().invites.length;

  const publicResult = repo.createInvite({
    description: 'open invite at a corrupt venue',
    venueId: 'v_lantern',
    capacity: { mode: 'uncapped' },
    access: { mode: 'public' },
  });
  assert.equal(publicResult.ok, false);

  const privateResult = repo.createInvite({
    description: 'private invite at a corrupt venue',
    venueId: 'v_lantern',
    capacity: { mode: 'uncapped' },
    access: { mode: 'private' },
  });
  assert.equal(privateResult.ok, false);

  assert.equal(repo.getSnapshot().invites.length, before, 'no invite should be created against an invalid venue coordinate');
});

test('demo.switchPersona changes currentUserId and rejects an unknown id', () => {
  const repo = fresh();
  assert.ok(repo.demo.personas().find((p) => p.id === 'u_theo'));
  assert.equal(repo.demo.switchPersona('u_theo').ok, true);
  assert.equal(repo.getSnapshot().currentUserId, 'u_theo');
  assert.deepEqual(repo.demo.switchPersona('u_nobody'), { ok: false, reason: 'Unknown persona.' });
});

test('message requests: accept creates a DM thread, deny does not', () => {
  const repo = fresh();
  const threads = repo.getSnapshot().threads.length;
  assert.equal(repo.respondToMessageRequest('mr_felix', 'denied').ok, true);
  assert.equal(repo.getSnapshot().threads.length, threads);
  assert.equal(repo.respondToMessageRequest('mr_jun', 'accepted').ok, true);
  const s = repo.getSnapshot();
  assert.equal(s.threads.length, threads + 1);
  const dm = s.threads[0]!;
  assert.equal(dm.kind, 'dm');
  assert.equal(dm.messages[0]!.senderUserId, 'u_jun');
  assert.equal(repo.sendMessage(dm.id, 'yes! see you there').ok, true);
  assert.equal(repo.getSnapshot().threads[0]!.messages.length, 2);
});

test('message request from a live pin lands as pending for the other user', () => {
  const repo = fresh();
  assert.equal(repo.sendMessageRequest('u_theo', 'hey, coming to the warehouse?').ok, true);
  assert.equal(repo.sendMessageRequest('u_theo', 'again').ok, false, 'one pending at a time');
  const req = repo.getSnapshot().messageRequests.find((r) => r.toUserId === 'u_theo');
  assert.equal(req?.status, 'pending');
  assert.equal(req?.fromUserId, 'u_maya');
});
