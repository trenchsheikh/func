import type {
  AccountType,
  ChatMessage,
  ChatThread,
  Group,
  LatLng,
  LiveStatus,
  PoolInvite,
} from '@/domain/types';
import { canCreateInviteAs, isFull, relationTo } from '@/domain/pool';
import type {
  CommandResult,
  CreateInviteInput,
  CreateInviteResult,
  FuncRepository,
  Snapshot,
} from './repository';
import type { DemoControls } from './demo';

export interface Clock {
  now(): Date;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter.toString(36)}`;
}

function isValidLatLng(loc: LatLng | undefined): loc is LatLng {
  return (
    !!loc &&
    Number.isFinite(loc.lat) && loc.lat >= -90 && loc.lat <= 90 &&
    Number.isFinite(loc.lng) && loc.lng >= -180 && loc.lng <= 180
  );
}

/**
 * Fully mocked, in-memory implementation. No persistence: every construction
 * starts from `buildSeed(now)`, so every app launch is pristine.
 */
export class InMemoryRepository implements FuncRepository {
  private snapshot: Snapshot;
  private readonly listeners = new Set<() => void>();
  /** Each user's device position, independent of live-status/fix visibility. No entry = no fix, ever. */
  private readonly deviceFixes: ReadonlyMap<string, LatLng>;

  readonly demo: DemoControls = {
    personas: () => this.snapshot.users.map((u) => ({ id: u.id, label: u.personalProfile.displayName })),
    switchPersona: (userId: string): CommandResult => {
      const target = this.snapshot.users.find((u) => u.id === userId);
      if (!target) return { ok: false, reason: 'Unknown persona.' };
      this.patch({ currentUserId: userId });
      return { ok: true };
    },
  };

  constructor(
    private readonly buildSeed: (now: Date) => Snapshot,
    private readonly clock: Clock = { now: () => new Date() },
  ) {
    this.snapshot = buildSeed(clock.now());
    const fixes = new Map<string, LatLng>();
    for (const u of this.snapshot.users) {
      const loc = u.personalProfile.lastKnownLocation;
      if (loc) fixes.set(u.id, { lat: loc.lat, lng: loc.lng });
    }
    this.deviceFixes = fixes;
  }

  getSnapshot(): Snapshot {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  reset(): void {
    this.commit(this.buildSeed(this.clock.now()));
  }

  // -------------------------------------------------------------------------
  // helpers
  // -------------------------------------------------------------------------

  private commit(next: Snapshot) {
    this.snapshot = next;
    this.listeners.forEach((l) => l());
  }

  private patch(partial: Partial<Snapshot>) {
    this.commit({ ...this.snapshot, ...partial });
  }

  private me() {
    const u = this.snapshot.users.find((x) => x.id === this.snapshot.currentUserId);
    if (!u) throw new Error('current user missing from snapshot');
    return u;
  }

  /** The party the current user speaks for. */
  private myGroup(): Group {
    const g = this.snapshot.groups.find((x) => x.leadUserId === this.snapshot.currentUserId);
    if (!g) throw new Error('current user has no group');
    return g;
  }

  private partySizeOf = (groupId: string): number => {
    const g = this.snapshot.groups.find((x) => x.id === groupId);
    return g ? Math.max(1, g.memberUserIds.length) : 1;
  };

  private updateInvite(id: string, fn: (inv: PoolInvite) => PoolInvite) {
    this.patch({
      invites: this.snapshot.invites.map((inv) => (inv.id === id ? fn(inv) : inv)),
    });
  }

  private appendMessage(threadId: string, msg: ChatMessage) {
    this.patch({
      threads: this.snapshot.threads.map((t) =>
        t.id === threadId ? { ...t, messages: [...t.messages, msg] } : t,
      ),
    });
  }

  private addGroupToThread(threadId: string, groupId: string) {
    this.patch({
      threads: this.snapshot.threads.map((t) =>
        t.id === threadId && !t.participantGroupIds.includes(groupId)
          ? { ...t, participantGroupIds: [...t.participantGroupIds, groupId] }
          : t,
      ),
    });
  }

  // -------------------------------------------------------------------------
  // identity
  // -------------------------------------------------------------------------

  setLiveStatus(status: LiveStatus): CommandResult {
    const me = this.me();
    if (me.activeProfile !== 'personal') {
      return { ok: false, reason: 'Business accounts have no live status.' };
    }
    const now = this.clock.now().toISOString();
    this.patch({
      users: this.snapshot.users.map((u) => {
        if (u.id !== me.id) return u;
        if (status === 'off') {
          // Off removes the fix immediately -- no lingering pin while status is off.
          const { lastKnownLocation: _drop, ...rest } = u.personalProfile;
          return { ...u, personalProfile: { ...rest, liveStatus: status, liveStatusSince: now } };
        }
        // Turning live back on republishes from the device's fix, if it has one.
        const fix = this.deviceFixes.get(u.id);
        const lastKnownLocation = fix ? { ...fix, timestamp: now } : u.personalProfile.lastKnownLocation;
        return {
          ...u,
          personalProfile: {
            ...u.personalProfile,
            liveStatus: status,
            liveStatusSince: now,
            ...(lastKnownLocation ? { lastKnownLocation } : {}),
          },
        };
      }),
    });
    return { ok: true };
  }

  switchProfile(to: AccountType): CommandResult {
    const me = this.me();
    if (to === 'business' && !me.businessProfile) {
      return { ok: false, reason: 'This account has no business profile.' };
    }
    if (me.activeProfile === to) return { ok: true };
    this.patch({
      users: this.snapshot.users.map((u) => {
        if (u.id !== me.id) return u;
        if (to !== 'business') return { ...u, activeProfile: to };
        // Switching into business removes live-status access and the fix
        // itself; the personal profile's status is switched off rather than
        // left silently broadcasting.
        const { lastKnownLocation: _drop, ...rest } = u.personalProfile;
        return { ...u, activeProfile: to, personalProfile: { ...rest, liveStatus: 'off' } };
      }),
    });
    return { ok: true };
  }

  // -------------------------------------------------------------------------
  // pool invites
  // -------------------------------------------------------------------------

  createInvite(input: CreateInviteInput): CreateInviteResult {
    const me = this.me();
    const canCreate = canCreateInviteAs(me);
    if (!canCreate.ok) return canCreate;

    let location: LatLng;
    const venue = input.venueId ? this.snapshot.venues.find((v) => v.id === input.venueId) : undefined;

    if (input.access.mode === 'public') {
      // A missing venueId and an unresolved one are the same failure from the
      // creator's perspective: this open invite has no listed venue to anchor it.
      if (!venue) {
        return {
          ok: false,
          reason: 'Open invites must be at a listed venue -- private places need a private invite.',
        };
      }
      location = venue.location;
    } else if (input.venueId) {
      if (!venue) return { ok: false, reason: 'Pin a location.' };
      location = venue.location;
    } else if (isValidLatLng(input.location)) {
      location = input.location;
    } else {
      return { ok: false, reason: 'Pin a location.' };
    }

    const group = this.myGroup();
    const now = this.clock.now().toISOString();
    const inviteId = nextId('inv');
    const chatId = nextId('thr');
    const invite: PoolInvite = {
      id: inviteId,
      hostGroupId: group.id,
      description: input.description.trim(),
      location,
      capacity:
        input.capacity.mode === 'capped' && input.capacity.max != null
          ? { mode: 'capped', max: input.capacity.max }
          : { mode: 'uncapped' },
      access: { mode: input.access.mode },
      requests: [],
      attendeeGroupIds: [group.id],
      groupChatId: chatId,
      createdByAccountType: me.activeProfile,
      ...(input.startsAt ? { startsAt: input.startsAt } : {}),
      createdAt: now,
    };
    // Every invite gets its group chat on creation.
    const chat: ChatThread = {
      id: chatId,
      kind: 'pool',
      title: invite.description.length > 40
        ? `${invite.description.slice(0, 40)}…`
        : invite.description,
      participantGroupIds: [group.id],
      poolInviteId: inviteId,
      messages: [
        {
          id: nextId('msg'),
          senderUserId: me.id,
          text: 'Group chat created — say hi when you join.',
          sentAt: now,
        },
      ],
    };
    this.patch({
      invites: [invite, ...this.snapshot.invites],
      threads: [chat, ...this.snapshot.threads],
    });
    return { ok: true, inviteId };
  }

  joinInvite(inviteId: string, partySize: number): CommandResult {
    const invite = this.snapshot.invites.find((i) => i.id === inviteId);
    if (!invite) return { ok: false, reason: 'Invite not found.' };
    if (invite.access.mode !== 'public') {
      return { ok: false, reason: 'This invite is private — request to join instead.' };
    }
    const group = this.myGroup();
    const rel = relationTo(invite, group.id);
    if (rel === 'host' || rel === 'attending') return { ok: true };
    if (isFull(invite, this.partySizeOf, partySize)) {
      return { ok: false, reason: 'This one is full.' };
    }
    this.updateInvite(inviteId, (inv) => ({
      ...inv,
      attendeeGroupIds: [...inv.attendeeGroupIds, group.id],
      // Record the party size so capacity maths stays honest for public joins.
      requests: [
        ...inv.requests.filter((r) => r.requestingGroupId !== group.id),
        { requestingGroupId: group.id, partySize: Math.max(1, partySize), status: 'accepted' },
      ],
    }));
    // Public: joining auto-adds you to the group chat.
    this.addGroupToThread(invite.groupChatId, group.id);
    return { ok: true };
  }

  requestToJoin(inviteId: string, partySize: number, message?: string): CommandResult {
    const invite = this.snapshot.invites.find((i) => i.id === inviteId);
    if (!invite) return { ok: false, reason: 'Invite not found.' };
    if (invite.access.mode !== 'private') {
      return { ok: false, reason: 'This invite is open — just join.' };
    }
    const group = this.myGroup();
    const rel = relationTo(invite, group.id);
    if (rel !== 'none' && rel !== 'denied') return { ok: true };
    const text = message?.trim();
    this.updateInvite(inviteId, (inv) => ({
      ...inv,
      requests: [
        ...inv.requests.filter((r) => r.requestingGroupId !== group.id),
        {
          requestingGroupId: group.id,
          partySize: Math.max(1, partySize),
          status: 'pending',
          ...(text ? { preAcceptMessage: { text, messageRequestStatus: 'pending' } } : {}),
        },
      ],
    }));
    return { ok: true };
  }

  reviewRequest(
    inviteId: string,
    requestingGroupId: string,
    decision: 'accepted' | 'denied',
  ): CommandResult {
    const invite = this.snapshot.invites.find((i) => i.id === inviteId);
    if (!invite) return { ok: false, reason: 'Invite not found.' };
    if (invite.hostGroupId !== this.myGroup().id) {
      return { ok: false, reason: 'Only the host can review requests.' };
    }
    const req = invite.requests.find((r) => r.requestingGroupId === requestingGroupId);
    if (!req || req.status !== 'pending') {
      return { ok: false, reason: 'Request is no longer pending.' };
    }
    if (decision === 'accepted' && isFull(invite, this.partySizeOf, req.partySize)) {
      return { ok: false, reason: `Not enough room for a party of ${req.partySize}.` };
    }
    const now = this.clock.now().toISOString();
    this.updateInvite(inviteId, (inv) => ({
      ...inv,
      requests: inv.requests.map((r) =>
        r.requestingGroupId !== requestingGroupId
          ? r
          : {
              ...r,
              status: decision,
              ...(r.preAcceptMessage && decision === 'accepted'
                ? { preAcceptMessage: { ...r.preAcceptMessage, messageRequestStatus: 'accepted' } }
                : {}),
            },
      ),
      attendeeGroupIds:
        decision === 'accepted' && !inv.attendeeGroupIds.includes(requestingGroupId)
          ? [...inv.attendeeGroupIds, requestingGroupId]
          : inv.attendeeGroupIds,
    }));
    if (decision === 'accepted') {
      // Private chats include only accepted groups — add them now, and deliver
      // the pre-accept message into the thread as their first message.
      this.addGroupToThread(invite.groupChatId, requestingGroupId);
      const group = this.snapshot.groups.find((g) => g.id === requestingGroupId);
      if (req.preAcceptMessage && group) {
        this.appendMessage(invite.groupChatId, {
          id: nextId('msg'),
          senderUserId: group.leadUserId,
          text: req.preAcceptMessage.text,
          sentAt: now,
        });
      }
    }
    return { ok: true };
  }

  // -------------------------------------------------------------------------
  // messaging
  // -------------------------------------------------------------------------

  sendMessage(threadId: string, text: string): CommandResult {
    const body = text.trim();
    if (!body) return { ok: false, reason: 'Empty message.' };
    const thread = this.snapshot.threads.find((t) => t.id === threadId);
    if (!thread) return { ok: false, reason: 'Thread not found.' };
    if (!thread.participantGroupIds.includes(this.myGroup().id)) {
      return { ok: false, reason: 'You are not in this chat.' };
    }
    this.appendMessage(threadId, {
      id: nextId('msg'),
      senderUserId: this.snapshot.currentUserId,
      text: body,
      sentAt: this.clock.now().toISOString(),
    });
    return { ok: true };
  }

  respondToMessageRequest(requestId: string, decision: 'accepted' | 'denied'): CommandResult {
    const req = this.snapshot.messageRequests.find((r) => r.id === requestId);
    if (!req) return { ok: false, reason: 'Request not found.' };
    if (req.toUserId !== this.snapshot.currentUserId) {
      return { ok: false, reason: 'Not your request.' };
    }
    if (req.status !== 'pending') return { ok: false, reason: 'Already handled.' };
    this.patch({
      messageRequests: this.snapshot.messageRequests.map((r) =>
        r.id === requestId ? { ...r, status: decision } : r,
      ),
    });
    if (decision === 'accepted') {
      const fromGroup = this.snapshot.groups.find((g) => g.leadUserId === req.fromUserId);
      const from = this.snapshot.users.find((u) => u.id === req.fromUserId);
      if (!fromGroup || !from) return { ok: true };
      const thread: ChatThread = {
        id: nextId('thr'),
        kind: 'dm',
        title: from.personalProfile.displayName,
        participantGroupIds: [fromGroup.id, this.myGroup().id],
        messages: [
          {
            id: nextId('msg'),
            senderUserId: req.fromUserId,
            text: req.text,
            sentAt: req.createdAt,
          },
        ],
      };
      this.patch({ threads: [thread, ...this.snapshot.threads] });
    }
    return { ok: true };
  }

  sendMessageRequest(toUserId: string, text: string): CommandResult {
    const body = text.trim();
    if (!body) return { ok: false, reason: 'Say something first.' };
    if (toUserId === this.snapshot.currentUserId) return { ok: false, reason: 'That is you.' };
    const target = this.snapshot.users.find((u) => u.id === toUserId);
    if (!target) return { ok: false, reason: 'User not found.' };
    const existing = this.snapshot.messageRequests.find(
      (r) => r.fromUserId === this.snapshot.currentUserId && r.toUserId === toUserId && r.status === 'pending',
    );
    if (existing) return { ok: false, reason: 'You already have a request waiting with them.' };
    this.patch({
      messageRequests: [
        {
          id: nextId('mr'),
          fromUserId: this.snapshot.currentUserId,
          toUserId,
          text: body,
          status: 'pending',
          createdAt: this.clock.now().toISOString(),
        },
        ...this.snapshot.messageRequests,
      ],
    });
    return { ok: true };
  }

  // -------------------------------------------------------------------------
  // stories
  // -------------------------------------------------------------------------

  postStory(text: string): CommandResult {
    const body = text.trim();
    if (!body) return { ok: false, reason: 'Say something first.' };
    this.patch({
      stories: [
        {
          id: nextId('sty'),
          authorUserId: this.snapshot.currentUserId,
          text: body,
          createdAt: this.clock.now().toISOString(),
        },
        ...this.snapshot.stories,
      ],
    });
    return { ok: true };
  }
}
