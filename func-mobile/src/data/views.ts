import type { AccountType, ChatThread, FuncUser, Group, LatLng, LiveStatus, PoolInvite, VerificationStatus } from '@/domain/types';
import type { InviteLocationDisclosure, ViewerContext, ViewerInviteRelation, PersonDisclosure } from '@/domain/visibility';
import { inviteDisclosure, isVerifiedBusiness, personDisclosure, venueGlow } from '@/domain/visibility';
import { attendingPartySize, pendingRequests, relationTo, seatsLeft as inviteSeatsLeft } from '@/domain/pool';
import { canUseLiveStatus, isPresenceLive } from '@/domain/liveStatus';
import type { Snapshot } from './repository';
import { groupById, groupLead, lastActivity, partySizeOf, pendingMessageRequests, userById, viewerContextOf } from './selectors';

/** The only identity shape the UI ever sees. */
export interface PersonSummary {
  readonly id: string;
  /** The person's display name -- or the venue name when the account is ACTING as a simulated-verified business (the operator's personal name never leaves the data layer). */
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
  readonly venues: readonly import('@/domain/types').Venue[];
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

function personSummary(user: FuncUser): PersonSummary {
  const acting = user.activeProfile === 'business' && isVerifiedBusiness(user);
  return {
    id: user.id,
    displayName: acting ? user.businessProfile!.venueName : user.personalProfile.displayName,
    handle: user.handle,
    photo: user.personalProfile.photo,
    ...(acting ? { verifiedBusiness: { venueName: user.businessProfile!.venueName } } : {}),
  };
}

/** Host identity follows the profile the invite was created under, not the host's current one. */
function hostPersonSummary(invite: PoolInvite, host: FuncUser | undefined): PersonSummary {
  if (!host) return unknownPerson();
  if (invite.createdByAccountType === 'business' && host.businessProfile) {
    return {
      id: host.id,
      displayName: host.businessProfile.venueName,
      handle: host.handle,
      photo: host.personalProfile.photo,
      verifiedBusiness: { venueName: host.businessProfile.venueName },
    };
  }
  return personSummary(host);
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
    lead: lead ? personSummary(lead) : unknownPerson(),
    members: members.map(personSummary),
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
    host: hostPersonSummary(invite, host),
    where,
    viewer: { relation },
  };
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
    relation === 'host' || relation === 'attending'
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

  const pendingMessageRequestsTo = s.messageRequests
    .filter((r) => r.fromUserId === self.id && r.status === 'pending')
    .map((r) => r.toUserId);

  return {
    id: self.id,
    displayName: self.personalProfile.displayName,
    handle: self.handle,
    photo: self.personalProfile.photo,
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
      lead: personSummary(self),
      members: memberList.map(personSummary),
    },
    stories,
    pendingMessageRequestsTo,
  };
}

function buildThread(
  s: Snapshot,
  t: ChatThread,
  addPerson: (u: FuncUser) => void,
): ThreadView {
  const participants = t.participantGroupIds
    .map((gid) => groupLead(s, gid))
    .filter((u): u is FuncUser => !!u);
  participants.forEach(addPerson);
  t.messages.forEach((m) => {
    const sender = userById(s, m.senderUserId);
    if (sender) addPerson(sender);
  });

  return {
    id: t.id,
    kind: t.kind,
    title: t.title,
    ...(t.poolInviteId ? { inviteId: t.poolInviteId } : {}),
    participants: participants.map(personSummary),
    messages: t.messages.map((m) => ({ id: m.id, senderId: m.senderUserId, text: m.text, sentAt: m.sentAt })),
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

  const people = new Map<string, PersonSummary>();
  const addPerson = (u: FuncUser) => {
    if (!people.has(u.id)) people.set(u.id, personSummary(u));
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
    presence.push({ person: personSummary(u), disclosure });
  }

  const glowVenueIds = venueGlow(ctx, s.users, s.venues);

  const threads: ThreadView[] = s.threads
    .filter((t) => t.participantGroupIds.includes(ctx.viewerGroupId))
    .filter((t) => !t.poolInviteId || invitesById.has(t.poolInviteId))
    .map((t) => buildThread(s, t, addPerson));

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
          return personSummary(u);
        }),
    }))
    .filter((batch) => batch.pendingCount > 0);

  const messageRequests: IncomingMessageRequestView[] = pendingMessageRequests(s)
    .map((r) => {
      const from = userById(s, r.fromUserId);
      if (from) addPerson(from);
      return {
        id: r.id,
        from: from ? personSummary(from) : unknownPerson(),
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
