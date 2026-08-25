import type { FuncUser, PoolInvite, PoolRequest } from './types';

export function acceptedRequests(invite: PoolInvite): PoolRequest[] {
  return invite.requests.filter((r) => r.status === 'accepted');
}

export function pendingRequests(invite: PoolInvite): PoolRequest[] {
  return invite.requests.filter((r) => r.status === 'pending');
}

/**
 * Prototype-safe upper bound for any single party size or invite capacity
 * maximum. This is an in-memory demo with no real venues, backend, or
 * payment rails -- nothing here should legitimately exceed a few hundred
 * people (the largest plausible single Pool is a rented-out venue), and the
 * UI's own party-size stepper already tops out at 12. 500 leaves generous
 * headroom over anything the product can produce today while still
 * rejecting corrupted or adversarial values -- NaN, Infinity, fractions, or
 * absurd counts -- before they ever reach capacity arithmetic.
 */
export const MAX_POOL_SIZE = 500;

/** A party size or capacity maximum that's safe to use in capacity arithmetic. */
function isValidPoolSize(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n) && n > 0 && n <= MAX_POOL_SIZE;
}

/**
 * Seats taken = attendees (host excluded) by party size. The party size lives
 * on the group's request record when there is one (both private requests and
 * public joins record one), else falls back to the group's member count.
 * Non-finite, fractional, non-positive, or excessive persisted party sizes
 * are dropped from the count rather than propagated -- a single corrupt
 * value must not turn every downstream capacity check into NaN, which
 * compares false against everything and would silently defeat the cap.
 */
export function seatsTaken(invite: PoolInvite, partySizeOf: (groupId: string) => number): number {
  return invite.attendeeGroupIds
    .filter((g) => g !== invite.hostGroupId)
    .reduce((sum, g) => {
      const rec = invite.requests.find((r) => r.requestingGroupId === g && r.status === 'accepted');
      const size = rec?.partySize ?? partySizeOf(g);
      return sum + (isValidPoolSize(size) ? size : 0);
    }, 0);
}

/** Party size a group is attending with (request record first, group size otherwise). */
export function attendingPartySize(
  invite: PoolInvite,
  groupId: string,
  partySizeOf: (groupId: string) => number,
): number {
  const rec = invite.requests.find((r) => r.requestingGroupId === groupId && r.status === 'accepted');
  const size = rec?.partySize ?? partySizeOf(groupId);
  return isValidPoolSize(size) ? size : 0;
}

export function seatsLeft(
  invite: PoolInvite,
  partySizeOf: (groupId: string) => number,
): number | null {
  if (invite.capacity.mode === 'uncapped' || invite.capacity.max == null) return null;
  // An invalid capacity ceiling fails closed to "no room" rather than being
  // silently coerced (e.g. via Math.max) into a value that could
  // under-report occupancy and allow overbooking.
  if (!isValidPoolSize(invite.capacity.max)) return 0;
  const left = invite.capacity.max - seatsTaken(invite, partySizeOf);
  return left > 0 ? left : 0;
}

export function isFull(
  invite: PoolInvite,
  partySizeOf: (groupId: string) => number,
  incomingPartySize = 1,
): boolean {
  // An invalid incoming party size can't be safely admitted -- fail closed.
  if (!isValidPoolSize(incomingPartySize)) return true;
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

/**
 * Reads as "happening now" for Browse purposes: no scheduled start at all
 * (the Create form's own "Whenever" option — see `app/(tabs)/create.tsx`),
 * or a scheduled start that has already arrived. Not a new invite state —
 * `startsAt` already means exactly this; this only names the existing
 * distinction for display/sorting.
 */
export function isHappeningNow(invite: { readonly startsAt?: string }, now: Date): boolean {
  return !invite.startsAt || new Date(invite.startsAt) <= now;
}

/** Short human label for the capacity/access combination. */
export function accessLabel(invite: { readonly access: { readonly mode: 'private' | 'public' } }): string {
  return invite.access.mode === 'public' ? 'Open walk-in' : 'Request to join';
}

export function capacityLabel(invite: { readonly capacity: { readonly mode: 'capped' | 'uncapped'; readonly max?: number } }): string {
  if (invite.capacity.mode !== 'capped' || invite.capacity.max == null) return 'No cap';
  // An invalid persisted maximum reads as "Full" rather than a garbage
  // number -- consistent with seatsLeft/isFull treating it as no room.
  return isValidPoolSize(invite.capacity.max) ? `Max ${invite.capacity.max}` : 'Full';
}

/** Personal accounts may always post; business accounts must be verified first. */
export function canCreateInviteAs(user: FuncUser): { ok: true } | { ok: false; reason: string } {
  if (user.activeProfile === 'personal') return { ok: true };
  if (user.businessProfile?.verification.status === 'verified') return { ok: true };
  return { ok: false, reason: 'Business accounts must be verified before posting.' };
}
