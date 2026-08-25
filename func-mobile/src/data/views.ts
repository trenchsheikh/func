import type { AccountType, ChatThread, FuncUser, Group, LatLng, LiveStatus, PoolInvite, VerificationStatus, Venue } from '@/domain/types';
import type { InviteLocationDisclosure, ViewerContext, ViewerInviteRelation, PersonDisclosure } from '@/domain/visibility';
import { inviteDisclosure, isVerifiedBusiness, personDisclosure, venueGlow } from '@/domain/visibility';
import { attendingPartySize, pendingRequests, relationTo, seatsLeft as inviteSeatsLeft } from '@/domain/pool';
import { canUseLiveStatus, isPresenceLive } from '@/domain/liveStatus';
import type { Snapshot } from './repository';
import { groupById, groupLead, lastActivity, partySizeOf, pendingMessageRequests, userById, viewerContextOf } from './selectors';

/**
 * The only identity shape the UI ever sees. For a verified business acting
 * as itself (or referenced as the host of a business-created invite), every
 * field here is an opaque venue persona -- id, handle, and photo included,
 * never the operator's own -- see `venuePersona` (Stage 11, reviewer
 * finding 5, bounded part 1).
 */
export interface PersonSummary {
  readonly id: string;
  /** The person's display name -- or the venue name for a business persona. */
  readonly displayName: string;
  readonly handle: string;
  /** Avatar descriptor ('mono:<hex>' in the prototype). */
  readonly photo: string;
  /** Present only when the account is acting as a simulated-verified business, or is referenced as the host of a business-created invite. An owner acting personally (with no such reference) gets no badge. */
  readonly verifiedBusiness?: { readonly venueName: string };
}

/** Party size, not a group object. Members are present only where the audience is entitled. */
export interface PartySummary {
  readonly size: number;
  readonly lead: PersonSummary;
  readonly members?: readonly PersonSummary[];
}

export interface StoryView { readonly id: string; readonly text: string; readonly createdAt: string }

export interface SelfView {
  readonly id: string;
  readonly displayName: string;
  readonly handle: string;
  readonly photo: string;
  readonly activeProfile: AccountType;
  readonly liveStatus: LiveStatus;
  readonly isLive: boolean;
  readonly canUseLiveStatus: boolean;
  readonly premium: boolean;
  readonly business?: { readonly venueName: string; readonly verification: VerificationStatus };
  readonly party: PartySummary & { readonly members: readonly PersonSummary[] };
  readonly stories: readonly StoryView[];
  readonly pendingMessageRequestsTo: readonly string[];
}

export interface InviteCardView {
  readonly id: string;
  readonly description: string;
  readonly createdAt: string;
  readonly startsAt?: string;
  readonly access: { readonly mode: 'private' | 'public' };
  readonly capacity: { readonly mode: 'capped' | 'uncapped'; readonly max?: number };
  readonly seatsLeft: number | null;
  readonly goingCount: number;
  readonly hostedByVerifiedBusiness: boolean;
  readonly host: PersonSummary;
  readonly where: InviteLocationDisclosure;
  readonly viewer: { readonly relation: ViewerInviteRelation };
}

export interface InviteDetailView {
  readonly id: string;
  readonly description: string;
  readonly createdAt: string;
  readonly startsAt?: string;
  readonly access: { readonly mode: 'private' | 'public' };
  readonly capacity: { readonly mode: 'capped' | 'uncapped'; readonly max?: number };
  readonly seatsLeft: number | null;
  readonly goingCount: number;
  readonly hostedByVerifiedBusiness: boolean;
  readonly host: PersonSummary;
  readonly where: InviteLocationDisclosure;
  readonly viewer: {
    readonly relation: ViewerInviteRelation;
    readonly ownRequest?: { readonly partySize: number; readonly status: 'pending' | 'accepted' | 'denied'; readonly preAcceptMessage?: string };
  };
  readonly plan?: AcceptedPlanView;
  readonly review?: HostReviewView;
}

export interface AcceptedPlanView {
  readonly inviteId: string;
  readonly threadId: string;
  readonly attendees: readonly PartySummary[];
}

export interface HostReviewView {
  readonly inviteId: string;
  readonly seatsLeft: number | null;
  readonly pending: readonly RequestReviewItem[];
  readonly decided: readonly RequestReviewItem[];
}

export interface RequestReviewItem {
  readonly partyKey: string;
  readonly party: PartySummary & { readonly members: readonly PersonSummary[] };
  readonly status: 'pending' | 'accepted' | 'denied';
  readonly preAcceptMessage?: string;
}

export interface PresenceItem {
  readonly person: PersonSummary;
  readonly disclosure: Exclude<PersonDisclosure, { kind: 'none' }>;
}

export interface ThreadView {
  readonly id: string;
  readonly kind: 'pool' | 'dm';
  readonly title: string;
  readonly inviteId?: string;
  readonly participants: readonly PersonSummary[];
  readonly messages: readonly MessageView[];
  readonly lastActivity: string;
}
export interface MessageView { readonly id: string; readonly senderId: string; readonly text: string; readonly sentAt: string }

export interface IncomingMessageRequestView {
  readonly id: string;
  readonly from: PersonSummary;
  readonly text: string;
  readonly createdAt: string;
}

export interface InboxView {
  readonly joinBatches: readonly { readonly invite: InviteCardView; readonly pendingCount: number; readonly pendingLeads: readonly PersonSummary[] }[];
  readonly messageRequests: readonly IncomingMessageRequestView[];
}

export interface ViewerSnapshot {
  readonly authority: 'simulated' | 'server';
  readonly self: SelfView;
  readonly people: ReadonlyMap<string, PersonSummary>;
  readonly venues: readonly Venue[];
  readonly invites: readonly InviteCardView[];
  readonly inviteDetails: ReadonlyMap<string, InviteDetailView>;
  readonly presence: readonly PresenceItem[];
  readonly glowVenueIds: ReadonlySet<string>;
  readonly threads: readonly ThreadView[];
  readonly inbox: InboxView;
}

// ---------------------------------------------------------------------------
// viewFor -- the one function that turns a Snapshot into a ViewerSnapshot.
// Every field above is built fresh from whitelisted pieces; no raw domain
// record ever crosses this boundary unfiltered.
// ---------------------------------------------------------------------------

function unknownPerson(): PersonSummary {
  return { id: 'unknown', displayName: 'Unknown', handle: '', photo: '' };
}

/**
 * Deterministic, non-cryptographic hash -> a stable hex color per venue id,
 * so every venue persona gets a consistent avatar swatch that carries no
 * information about the operator behind it.
 */
function venueColorHex(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return `#${(hash >>> 0).toString(16).padStart(6, '0').slice(-6)}`;
}

/**
 * A verified business's opaque public identity -- derived entirely from its
 * resolved Venue record, never from the operator's FuncUser. id/handle/photo
 * are all venue-scoped; only displayName (the venue name) was ever public
 * before this. The single construction point for the venue persona, so
 * every surface that shows one (presence, invite hosting, self-view,
 * thread participants, and host-group messages) stays in lockstep.
 */
function venuePersona(venue: Venue): PersonSummary {
  return {
    id: `biz:${venue.id}`,
    displayName: venue.name,
    handle: venue.id.replace(/^v_/, ''),
    photo: `mono:${venueColorHex(venue.id)}`,
    verifiedBusiness: { venueName: venue.name },
  };
}

function personSummary(user: FuncUser, venues: readonly Venue[]): PersonSummary {
  if (user.activeProfile === 'business' && isVerifiedBusiness(user) && user.businessProfile) {
    const venue = venues.find((v) => v.name === user.businessProfile!.venueName);
    // Fail closed to the existing unknown projection rather than falling
    // back to any operator data if the venue itself can't be resolved.
    return venue ? venuePersona(venue) : unknownPerson();
  }
  return {
    id: user.id,
    displayName: user.personalProfile.displayName,
    handle: user.handle,
    photo: user.personalProfile.photo,
  };
}

/** Host identity follows the profile the invite was created under, not the host's current one. */
function hostPersonSummary(invite: PoolInvite, host: FuncUser | undefined, venues: readonly Venue[]): PersonSummary {
  if (!host) return unknownPerson();
  if (invite.createdByAccountType === 'business' && host.businessProfile) {
    const venue = venues.find((v) => v.name === host.businessProfile!.venueName);
    return venue ? venuePersona(venue) : unknownPerson();
  }
  return personSummary(host, venues);
}

/** A business-hosted invite is hidden entirely once its verification is revoked. */
function inviteVisible(invite: PoolInvite, host: FuncUser | undefined): boolean {
  if (invite.createdByAccountType !== 'business') return true;
  return !!host && isVerifiedBusiness(host);
}

function goingCount(s: Snapshot, invite: PoolInvite): number {
  const sizeOf = partySizeOf(s);
  return invite.attendeeGroupIds.reduce((sum, g) => sum + attendingPartySize(invite, g, sizeOf), 0);
}

function partyOf(
  s: Snapshot,
  groupId: string,
  size: number,
  addPerson: (u: FuncUser) => void,
): PartySummary & { readonly members: readonly PersonSummary[] } {
  const group: Group | undefined = groupById(s, groupId);
  const lead = group ? userById(s, group.leadUserId) : undefined;
  if (lead) addPerson(lead);
  const members = (group ? group.memberUserIds : [])
    .map((id) => userById(s, id))
    .filter((u): u is FuncUser => !!u);
  members.forEach(addPerson);
  return {
    size,
    lead: lead ? personSummary(lead, s.venues) : unknownPerson(),
    members: members.map((u) => personSummary(u, s.venues)),
  };
}

/** Shown in place of the host's authored text to any audience that isn't entitled to it (Stage 11, reviewer finding 1 / D4). */
const GENERIC_INVITE_DESCRIPTION = 'Private plan';

/**
 * Authored invite text is only for audiences who already have the exact
 * location disclosed -- an area label or hidden disclosure must not leak
 * the host's own words either. Reuses `where` (the same InviteLocationDisclosure
 * already computed for the card) rather than re-deriving relation/venue
 * logic here, so this stays in lockstep with wherever a coordinate is or
 * isn't shown.
 */
function disclosedDescription(invite: PoolInvite, where: InviteLocationDisclosure): string {
  return where.kind === 'exact' ? invite.description : GENERIC_INVITE_DESCRIPTION;
}

function buildInviteCard(
  s: Snapshot,
  invite: PoolInvite,
  host: FuncUser | undefined,
  ctx: ViewerContext,
  relation: ViewerInviteRelation,
): InviteCardView {
  const where = inviteDisclosure(ctx, invite, host, s.venues, relation);
  return {
    id: invite.id,
    description: disclosedDescription(invite, where),
    createdAt: invite.createdAt,
    ...(invite.startsAt ? { startsAt: invite.startsAt } : {}),
    access: invite.access,
    capacity: invite.capacity,
    seatsLeft: inviteSeatsLeft(invite, partySizeOf(s)),
    goingCount: goingCount(s, invite),
    hostedByVerifiedBusiness: invite.createdByAccountType === 'business',
    host: hostPersonSummary(invite, host, s.venues),
    where,
    viewer: { relation },
  };
}

/**
 * True iff `threadId` resolves to a thread this viewer would actually see
 * in their own thread list -- the same participant/sender integrity rule
 * `resolveThreadIdentities` applies to the visible-threads projection,
 * plus the same "viewer's own group is a participant" requirement. Reused
 * here so `AcceptedPlanView.threadId` can never point at a thread the
 * projection would otherwise hide -- one rule, not two that could drift.
 */
function isViewerVisibleThread(s: Snapshot, ctx: ViewerContext, threadId: string): boolean {
  const t = s.threads.find((th) => th.id === threadId);
  return !!t && t.participantGroupIds.includes(ctx.viewerGroupId) && resolveThreadIdentities(s, t) !== null;
}

function buildInviteDetail(
  s: Snapshot,
  invite: PoolInvite,
  host: FuncUser | undefined,
  ctx: ViewerContext,
  relation: ViewerInviteRelation,
  card: InviteCardView,
  addPerson: (u: FuncUser) => void,
): InviteDetailView {
  const ownRequest = invite.requests.find((r) => r.requestingGroupId === ctx.viewerGroupId);

  const review: HostReviewView | undefined =
    relation === 'host'
      ? {
          inviteId: invite.id,
          seatsLeft: card.seatsLeft,
          pending: pendingRequests(invite).map((r) => ({
            partyKey: r.requestingGroupId,
            party: partyOf(s, r.requestingGroupId, r.partySize, addPerson),
            status: r.status,
            ...(r.preAcceptMessage ? { preAcceptMessage: r.preAcceptMessage.text } : {}),
          })),
          decided: invite.requests
            .filter((r) => r.status !== 'pending')
            .map((r) => ({
              partyKey: r.requestingGroupId,
              party: partyOf(s, r.requestingGroupId, r.partySize, addPerson),
              status: r.status,
              ...(r.preAcceptMessage ? { preAcceptMessage: r.preAcceptMessage.text } : {}),
            })),
        }
      : undefined;

  const plan: AcceptedPlanView | undefined =
    (relation === 'host' || relation === 'attending') && isViewerVisibleThread(s, ctx, invite.groupChatId)
      ? {
          inviteId: invite.id,
          threadId: invite.groupChatId,
          attendees: invite.attendeeGroupIds.map((g) =>
            partyOf(s, g, attendingPartySize(invite, g, partySizeOf(s)), addPerson),
          ),
        }
      : undefined;

  return {
    id: card.id,
    description: card.description,
    createdAt: card.createdAt,
    ...(card.startsAt ? { startsAt: card.startsAt } : {}),
    access: card.access,
    capacity: card.capacity,
    seatsLeft: card.seatsLeft,
    goingCount: card.goingCount,
    hostedByVerifiedBusiness: card.hostedByVerifiedBusiness,
    host: card.host,
    where: card.where,
    viewer: {
      relation,
      ...(ownRequest
        ? {
            ownRequest: {
              partySize: ownRequest.partySize,
              status: ownRequest.status,
              ...(ownRequest.preAcceptMessage ? { preAcceptMessage: ownRequest.preAcceptMessage.text } : {}),
            },
          }
        : {}),
    },
    ...(plan ? { plan } : {}),
    ...(review ? { review } : {}),
  };
}

function buildSelfView(
  s: Snapshot,
  self: FuncUser,
  ctx: ViewerContext,
  now: Date,
  addPerson: (u: FuncUser) => void,
): SelfView {
  const group = s.groups.find((g) => g.leadUserId === self.id);
  const members = (group ? group.memberUserIds : [self.id])
    .map((id) => userById(s, id))
    .filter((u): u is FuncUser => !!u);
  const memberList = members.length > 0 ? members : [self];
  memberList.forEach(addPerson);

  const stories: StoryView[] = s.stories
    .filter((st) => st.authorUserId === self.id)
    .map((st) => ({ id: st.id, text: st.text, createdAt: st.createdAt }));

  // Projected ids, not raw ones -- a pending request to a verified business
  // must read as its venue persona (or fail closed to 'unknown'), same as
  // every other surface that references a business by id.
  const pendingMessageRequestsTo = s.messageRequests
    .filter((r) => r.fromUserId === self.id && r.status === 'pending')
    .map((r) => {
      const to = userById(s, r.toUserId);
      if (to) addPerson(to);
      return to ? personSummary(to, s.venues).id : unknownPerson().id;
    });

  // While acting as a verified business (venue resolving), the viewer's own
  // identity is the same opaque venue persona everyone else sees them as --
  // never a mix of "my real id" and "my venue name".
  const selfSummary = personSummary(self, s.venues);

  return {
    id: selfSummary.id,
    displayName: selfSummary.displayName,
    handle: selfSummary.handle,
    photo: selfSummary.photo,
    activeProfile: self.activeProfile,
    liveStatus: self.personalProfile.liveStatus,
    isLive: isPresenceLive(self.personalProfile, now),
    canUseLiveStatus: canUseLiveStatus(self),
    premium: self.personalProfile.premium,
    ...(self.businessProfile
      ? { business: { venueName: self.businessProfile.venueName, verification: self.businessProfile.verification.status } }
      : {}),
    party: {
      size: memberList.length,
      lead: selfSummary,
      members: memberList.map((u) => personSummary(u, s.venues)),
    },
    stories,
    pendingMessageRequestsTo,
  };
}

/**
 * Resolves and validates every identity a thread depends on -- every
 * participant group must exist and have a real lead user, and every
 * message's sender must resolve to a real user who is a member of one of
 * the thread's participant groups. Returns null (never a partial result,
 * never a placeholder identity) if any of that fails: a malformed thread
 * is a thread the viewer never sees, not one rendered with gaps.
 */
function resolveThreadIdentities(
  s: Snapshot,
  t: ChatThread,
): { leads: FuncUser[]; senders: FuncUser[] } | null {
  const leads: FuncUser[] = [];
  const memberIds = new Set<string>();
  for (const gid of t.participantGroupIds) {
    const group = groupById(s, gid);
    if (!group) return null;
    const lead = userById(s, group.leadUserId);
    if (!lead) return null;
    leads.push(lead);
    group.memberUserIds.forEach((id) => memberIds.add(id));
  }

  const senders: FuncUser[] = [];
  for (const m of t.messages) {
    const sender = userById(s, m.senderUserId);
    if (!sender || !memberIds.has(sender.id)) return null;
    senders.push(sender);
  }

  return { leads, senders };
}

/**
 * A pool thread whose invite was created by a verified business attributes
 * every message from a member of the host's own group to that one, stable
 * venue persona -- derived once from the host here, never re-derived per
 * message or per session. Returns null if this thread isn't a
 * business-hosted pool thread at all (personal threads are untouched).
 *
 * This uses `personSummary` (gated on the host's CURRENT activeProfile),
 * not `hostPersonSummary`'s "follows the profile the invite was created
 * under" rule -- they can only agree because this function is only ever
 * reached for a thread whose invite already passed `inviteVisible`, which
 * itself requires the host to be currently verified. If that gate ever
 * changes, re-check this function and `hostPersonSummary` together.
 */
function hostGroupPersona(
  s: Snapshot,
  t: ChatThread,
): { summary: PersonSummary; memberIds: ReadonlySet<string> } | null {
  if (!t.poolInviteId) return null;
  const invite = s.invites.find((i) => i.id === t.poolInviteId);
  if (!invite || invite.createdByAccountType !== 'business') return null;
  const hostGroup = groupById(s, invite.hostGroupId);
  const hostUser = hostGroup ? userById(s, hostGroup.leadUserId) : undefined;
  if (!hostGroup || !hostUser) return null;
  return { summary: personSummary(hostUser, s.venues), memberIds: new Set(hostGroup.memberUserIds) };
}

function buildThread(
  s: Snapshot,
  t: ChatThread,
  addPerson: (u: FuncUser) => void,
): ThreadView | null {
  const resolved = resolveThreadIdentities(s, t);
  if (!resolved) return null;

  resolved.leads.forEach(addPerson);
  resolved.senders.forEach(addPerson);

  const hostPersona = hostGroupPersona(s, t);

  return {
    id: t.id,
    kind: t.kind,
    title: t.title,
    ...(t.poolInviteId ? { inviteId: t.poolInviteId } : {}),
    participants: resolved.leads.map((u) => personSummary(u, s.venues)),
    // Every sender is projected through personSummary -- a verified business
    // currently acting as itself is never shown as its raw operator id, in a
    // DM or otherwise -- except a business host-group member, who keeps the
    // one stable "created under business" persona from hostPersona instead
    // (see hostGroupPersona above) rather than being re-derived per message.
    messages: t.messages.map((m) => {
      // Re-resolved rather than indexed off `resolved.senders` -- every
      // message's sender is already guaranteed to resolve here (that's what
      // resolveThreadIdentities validated to get this far), but re-looking
      // it up keeps that guarantee local instead of leaning on parallel-
      // array-index correspondence.
      const sender = userById(s, m.senderUserId);
      const senderId =
        hostPersona && hostPersona.memberIds.has(m.senderUserId)
          ? hostPersona.summary.id
          : sender
            ? personSummary(sender, s.venues).id
            : m.senderUserId;
      return { id: m.id, senderId, text: m.text, sentAt: m.sentAt };
    }),
    lastActivity: lastActivity(t),
  };
}

/**
 * The only function that turns a raw Snapshot into what one viewer's UI is
 * allowed to see. Fails closed on unresolved references (never fabricates an
 * identity) and never mutates the snapshot or repository.
 */
export function viewFor(s: Snapshot, now: Date): ViewerSnapshot {
  const ctx = viewerContextOf(s, now);
  const selfUser = userById(s, s.currentUserId);
  if (!selfUser) throw new Error('current user missing');

  // Keyed by the *projected* id (a verified business's opaque persona id,
  // not FuncUser.id) -- that's the same id PersonSummary.id/MessageView.senderId
  // carry, so `people.get(...)` lookups against those fields resolve. Two
  // different verified businesses whose venues both fail to resolve would
  // collapse onto the same 'unknown' entry here (first writer wins) -- an
  // accepted tradeoff, since unknownPerson() carries no per-subject data to
  // lose by colliding, mirroring the pre-existing unknownPerson() fallback
  // used elsewhere in this file for other dangling references.
  const people = new Map<string, PersonSummary>();
  const addPerson = (u: FuncUser) => {
    const summary = personSummary(u, s.venues);
    if (!people.has(summary.id)) people.set(summary.id, summary);
  };
  addPerson(selfUser);

  const invites: InviteCardView[] = [];
  const invitesById = new Map<string, InviteCardView>();
  const inviteDetails = new Map<string, InviteDetailView>();
  for (const invite of s.invites) {
    const host = groupLead(s, invite.hostGroupId);
    if (!inviteVisible(invite, host)) continue;
    if (host) addPerson(host);
    const relation = relationTo(invite, ctx.viewerGroupId);
    const card = buildInviteCard(s, invite, host, ctx, relation);
    invites.push(card);
    invitesById.set(invite.id, card);
    inviteDetails.set(invite.id, buildInviteDetail(s, invite, host, ctx, relation, card, addPerson));
  }

  const presence: PresenceItem[] = [];
  for (const u of s.users) {
    const disclosure = personDisclosure(ctx, u, s.venues);
    if (disclosure.kind === 'none') continue;
    addPerson(u);
    presence.push({ person: personSummary(u, s.venues), disclosure });
  }

  const glowVenueIds = venueGlow(ctx, s.users, s.venues);

  const threads: ThreadView[] = s.threads
    .filter((t) => t.participantGroupIds.includes(ctx.viewerGroupId))
    .filter((t) => !t.poolInviteId || invitesById.has(t.poolInviteId))
    .map((t) => buildThread(s, t, addPerson))
    .filter((t): t is ThreadView => t !== null);

  const joinBatches = s.invites
    .filter((invite) => invite.hostGroupId === ctx.viewerGroupId && invitesById.has(invite.id))
    .map((invite) => ({
      invite: invitesById.get(invite.id)!,
      pendingCount: pendingRequests(invite).length,
      pendingLeads: pendingRequests(invite)
        .map((r) => groupLead(s, r.requestingGroupId))
        .filter((u): u is FuncUser => !!u)
        .map((u) => {
          addPerson(u);
          return personSummary(u, s.venues);
        }),
    }))
    .filter((batch) => batch.pendingCount > 0);

  const messageRequests: IncomingMessageRequestView[] = pendingMessageRequests(s)
    .map((r) => {
      const from = userById(s, r.fromUserId);
      if (from) addPerson(from);
      return {
        id: r.id,
        from: from ? personSummary(from, s.venues) : unknownPerson(),
        text: r.text,
        createdAt: r.createdAt,
      };
    });

  const self = buildSelfView(s, selfUser, ctx, now, addPerson);

  return {
    authority: ctx.authority,
    self,
    people,
    venues: s.venues,
    invites,
    inviteDetails,
    presence,
    glowVenueIds,
    threads,
    inbox: { joinBatches, messageRequests },
  };
}
