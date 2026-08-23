import type { AccountType, LatLng, LiveStatus, VerificationStatus } from '@/domain/types';
import type { InviteLocationDisclosure, ViewerInviteRelation, PersonDisclosure } from '@/domain/visibility';

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
