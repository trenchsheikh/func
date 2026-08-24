import type {
  AccountType,
  ChatThread,
  FuncUser,
  Group,
  LatLng,
  LiveStatus,
  MessageRequest,
  PoolInvite,
  Story,
  Venue,
} from '@/domain/types';

/** Symmetric friendship edge; mutuals are derived, never stored. */
export interface FriendEdge {
  readonly a: string;
  readonly b: string;
}

/**
 * Everything the UI can read, as one immutable snapshot. A new snapshot object
 * is produced on every mutation, so React can re-render by reference equality.
 *
 * A real backend would replace InMemoryRepository with something that keeps
 * this snapshot in sync with the server (polling, sockets, whatever) — the UI
 * contract does not change.
 */
export interface Snapshot {
  readonly currentUserId: string;
  readonly users: readonly FuncUser[];
  readonly groups: readonly Group[];
  readonly friendships: readonly FriendEdge[];
  readonly venues: readonly Venue[];
  readonly invites: readonly PoolInvite[];
  readonly threads: readonly ChatThread[];
  readonly messageRequests: readonly MessageRequest[];
  readonly stories: readonly Story[];
}

export interface CreateInviteInput {
  description: string;
  /** Required only when venueId is absent (private location). Ignored when venueId is present. */
  location?: LatLng;
  venueId?: string;
  capacity: { mode: 'capped' | 'uncapped'; max?: number };
  access: { mode: 'private' | 'public' };
  startsAt?: string;
}

export type CommandResult =
  | { ok: true }
  | { ok: false; reason: string };

export type CreateInviteResult =
  | { ok: true; inviteId: string }
  | { ok: false; reason: string };

export interface FuncRepository {
  /** Current immutable snapshot — stable reference until the next mutation. */
  getSnapshot(): Snapshot;
  /** Subscribe to snapshot changes. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;

  // --- identity -----------------------------------------------------------
  setLiveStatus(status: LiveStatus): CommandResult;
  switchProfile(to: AccountType): CommandResult;

  // --- pool invites -------------------------------------------------------
  createInvite(input: CreateInviteInput): CreateInviteResult;
  /** Public invites only. Joins immediately, subject to the capacity cap. */
  joinInvite(inviteId: string, partySize: number): CommandResult;
  /** Private invites only. Creates a pending request; never auto-accepts. */
  requestToJoin(inviteId: string, partySize: number, message?: string): CommandResult;
  /** Host reviews one request from the batch. */
  reviewRequest(
    inviteId: string,
    requestingGroupId: string,
    decision: 'accepted' | 'denied',
  ): CommandResult;

  // --- messaging ----------------------------------------------------------
  sendMessage(threadId: string, text: string): CommandResult;
  respondToMessageRequest(requestId: string, decision: 'accepted' | 'denied'): CommandResult;
  /** Open a conversation with someone you are not yet talking to — lands in their Inbox as a request. */
  sendMessageRequest(toUserId: string, text: string): CommandResult;

  // --- stories ------------------------------------------------------------
  postStory(text: string): CommandResult;

  /** Back to the pristine demo state. */
  reset(): void;
}
// No impersonation / persona command on this interface.

/** The command surface the UI may call. Raw state accessors are not part of it. */
export type FuncCommands = Pick<
  FuncRepository,
  | 'setLiveStatus' | 'switchProfile' | 'createInvite' | 'joinInvite' | 'requestToJoin'
  | 'reviewRequest' | 'sendMessage' | 'respondToMessageRequest' | 'sendMessageRequest' | 'postStory' | 'reset'
>;
