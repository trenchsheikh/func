import type { ChatThread, FuncUser, Group, PoolInvite } from '@/domain/types';
import { pendingRequests } from '@/domain/pool';
import type { Snapshot } from './repository';

export function userById(s: Snapshot, id: string): FuncUser | undefined {
  return s.users.find((u) => u.id === id);
}

export function currentUser(s: Snapshot): FuncUser {
  const u = userById(s, s.currentUserId);
  if (!u) throw new Error('current user missing');
  return u;
}

export function groupById(s: Snapshot, id: string): Group | undefined {
  return s.groups.find((g) => g.id === id);
}

export function groupLead(s: Snapshot, groupId: string): FuncUser | undefined {
  const g = groupById(s, groupId);
  return g ? userById(s, g.leadUserId) : undefined;
}

export function myGroup(s: Snapshot): Group {
  const g = s.groups.find((x) => x.leadUserId === s.currentUserId);
  if (!g) throw new Error('current user has no group');
  return g;
}

export function partySizeOf(s: Snapshot): (groupId: string) => number {
  return (groupId) => groupById(s, groupId)?.memberUserIds.length ?? 1;
}

export function inviteById(s: Snapshot, id: string): PoolInvite | undefined {
  return s.invites.find((i) => i.id === id);
}

export function threadById(s: Snapshot, id: string): ChatThread | undefined {
  return s.threads.find((t) => t.id === id);
}

/** Threads the current user's party is in, most recent activity first. */
export function myThreads(s: Snapshot): ChatThread[] {
  const gid = myGroup(s).id;
  return s.threads
    .filter((t) => t.participantGroupIds.includes(gid))
    .sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)));
}

export function lastActivity(t: ChatThread): string {
  return t.messages[t.messages.length - 1]?.sentAt ?? '';
}

/** Invites the current user hosts that have pending requests — batched per invite. */
export function hostedInvitesWithPending(s: Snapshot): Array<{ invite: PoolInvite; pending: number }> {
  const gid = myGroup(s).id;
  return s.invites
    .filter((i) => i.hostGroupId === gid)
    .map((invite) => ({ invite, pending: pendingRequests(invite).length }))
    .filter((x) => x.pending > 0);
}

export function pendingMessageRequests(s: Snapshot) {
  return s.messageRequests.filter((r) => r.toUserId === s.currentUserId && r.status === 'pending');
}

export function displayName(u: FuncUser | undefined): string {
  if (!u) return 'Someone';
  return u.activeProfile === 'business' && u.businessProfile
    ? u.businessProfile.venueName
    : u.personalProfile.displayName;
}

/** Host name for an invite: follows the profile it was created under, not the host's current one. */
export function hostDisplayName(s: Snapshot, invite: PoolInvite): string {
  const host = groupLead(s, invite.hostGroupId);
  if (!host) return 'Someone';
  return invite.createdByAccountType === 'business' && host.businessProfile
    ? host.businessProfile.venueName
    : host.personalProfile.displayName;
}
