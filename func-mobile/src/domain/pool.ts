import type { FuncUser, PoolInvite, PoolRequest } from './types';

export function acceptedRequests(invite: PoolInvite): PoolRequest[] {
  return invite.requests.filter((r) => r.status === 'accepted');
}

export function pendingRequests(invite: PoolInvite): PoolRequest[] {
  return invite.requests.filter((r) => r.status === 'pending');
}

/**
 * Seats taken = attendees (host excluded) by party size. The party size lives
 * on the group's request record when there is one (both private requests and
 * public joins record one), else falls back to the group's member count.
 */
export function seatsTaken(invite: PoolInvite, partySizeOf: (groupId: string) => number): number {
  return invite.attendeeGroupIds
    .filter((g) => g !== invite.hostGroupId)
    .reduce((sum, g) => {
      const rec = invite.requests.find((r) => r.requestingGroupId === g && r.status === 'accepted');
      return sum + (rec?.partySize ?? partySizeOf(g));
    }, 0);
}

/** Party size a group is attending with (request record first, group size otherwise). */
export function attendingPartySize(
  invite: PoolInvite,
  groupId: string,
  partySizeOf: (groupId: string) => number,
): number {
  const rec = invite.requests.find((r) => r.requestingGroupId === groupId && r.status === 'accepted');
  return rec?.partySize ?? partySizeOf(groupId);
}

export function seatsLeft(
  invite: PoolInvite,
  partySizeOf: (groupId: string) => number,
): number | null {
  if (invite.capacity.mode === 'uncapped' || invite.capacity.max == null) return null;
  return Math.max(0, invite.capacity.max - seatsTaken(invite, partySizeOf));
}

export function isFull(
  invite: PoolInvite,
  partySizeOf: (groupId: string) => number,
  incomingPartySize = 1,
): boolean {
  const left = seatsLeft(invite, partySizeOf);
  return left != null && left < incomingPartySize;
}

export type ViewerRelation =
  | 'host'
  | 'attending'
  | 'requested'
  | 'denied'
  | 'none';

export function relationTo(invite: PoolInvite, groupId: string): ViewerRelation {
  if (invite.hostGroupId === groupId) return 'host';
  if (invite.attendeeGroupIds.includes(groupId)) return 'attending';
  const req = invite.requests.find((r) => r.requestingGroupId === groupId);
  if (req?.status === 'pending') return 'requested';
  if (req?.status === 'denied') return 'denied';
  return 'none';
}

/** Short human label for the capacity/access combination. */
export function accessLabel(invite: PoolInvite): string {
  return invite.access.mode === 'public' ? 'Open walk-in' : 'Request to join';
}

export function capacityLabel(invite: PoolInvite): string {
  return invite.capacity.mode === 'capped' && invite.capacity.max != null
    ? `Max ${invite.capacity.max}`
    : 'No cap';
}

/** Personal accounts may always post; business accounts must be verified first. */
export function canCreateInviteAs(user: FuncUser): { ok: true } | { ok: false; reason: string } {
  if (user.activeProfile === 'personal') return { ok: true };
  if (user.businessProfile?.verification.status === 'verified') return { ok: true };
  return { ok: false, reason: 'Business accounts must be verified before posting.' };
}
