/**
 * Access — request → accept → pass.
 *
 * The commitment mechanic, and the part of the prototype that was debugged
 * hardest. Every guard in this file corresponds to a real bug found by playing
 * the app, not to a hypothetical. They are restated here as pure decisions so
 * they can be tested without a UI:
 *
 *   - capacity counts **party size**, not request count. A party of six
 *     consumes six seats. The prototype compared spots-left to zero and let six
 *     people into a table with two real seats.
 *   - a host cannot request or accept **their own listing** — checked at accept
 *     as well as at create, because accept is where a seat is really consumed.
 *   - one **pending** request per guest per target.
 *   - free accounts are capped at three pending; premium is uncapped. Unlimited
 *     requests only means something if there is a real cap to lift.
 *   - only the host may accept or decline; only the guest may cancel.
 *
 * This is the "active commitment" half of the product model. Unlike presence,
 * everything here legitimately requires a deliberate tap — that is the point of
 * the distinction Phoenix drew: passive presence should be effortless, but
 * binding a host to hold you a table should not be.
 */

import type { Clock, Timestamp } from './clock';
import type { Money, VenueId } from './geography';
import type {
  ActorId,
  AfterPartyId,
  BusinessId,
  PassId,
  PersonId,
  RequestId,
  TableId,
  ThreadId,
} from './ids';

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export type RequestKind = 'table' | 'after';

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface AccessRequest {
  readonly id: RequestId;
  readonly kind: RequestKind;
  readonly guestId: PersonId;
  readonly hostId: ActorId;
  readonly partySize: number;
  readonly venueId: VenueId | null;
  readonly tableId: TableId | null;
  readonly afterId: AfterPartyId | null;
  readonly status: RequestStatus;
  readonly createdAt: Timestamp;
  readonly respondedAt: Timestamp | null;
  readonly declineReason: string | null;
  readonly passId: PassId | null;
  readonly threadId: ThreadId | null;
}

export interface Pass {
  readonly id: PassId;
  readonly requestId: RequestId;
  readonly guestId: PersonId;
  readonly partySize: number;
  readonly venueId: VenueId;
  readonly tableId: TableId | null;
  readonly code: string;
  readonly issuedAt: Timestamp;
  readonly status: 'active' | 'spent' | 'expired';
  readonly rated: boolean;
}

export interface TableOffer {
  readonly id: TableId;
  readonly venueId: VenueId;
  readonly businessId: BusinessId;
  readonly name: string;
  readonly seats: number;
  readonly perHead: Money;
  readonly vibe: string;
}

export interface AfterParty {
  readonly id: AfterPartyId;
  readonly hostId: PersonId;
  /**
   * Deliberately coarse — a neighbourhood, never a street. The precise address
   * is withheld until the host accepts.
   */
  readonly area: string;
  readonly capacity: number;
  /** Guests already counted in from outside func. */
  readonly baseGoing: number;
  readonly vibe: readonly string[];
  /**
   * Revealed only on accept. Held separately from everything else so a screen
   * cannot render it by accident — see `revealedAddress`.
   */
  readonly address: string;
  readonly note: string;
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export type AccessError =
  | 'not_found'
  | 'already_resolved'
  | 'not_authorized'
  | 'own_listing'
  | 'duplicate'
  | 'request_cap'
  | 'at_capacity'
  | 'invalid_party_size';

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: AccessError };

const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = <T>(error: AccessError): Result<T> => ({ ok: false, error });

/**
 * Identity comparison across the actor union.
 *
 * A business is its own actor — the same id serves as business, account and
 * host — so a host id and a guest id can legitimately be the same string while
 * carrying different brands. Comparing through one helper keeps that quirk in
 * a single place instead of scattering casts through every guard.
 */
const sameActor = (a: ActorId, b: ActorId): boolean => (a as string) === (b as string);

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

/**
 * Party size bounds.
 *
 * The prototype offered 1–6 as chips, with "6+" quietly meaning exactly 6 —
 * a UI constant standing in for a product rule. Named here so it is a rule.
 */
export const MIN_PARTY_SIZE = 1;
export const MAX_PARTY_SIZE = 6;

/** Pending requests a non-premium account may have outstanding at once. */
export const FREE_PENDING_CAP = 3;

export function isValidPartySize(size: number): boolean {
  return Number.isInteger(size) && size >= MIN_PARTY_SIZE && size <= MAX_PARTY_SIZE;
}

// ---------------------------------------------------------------------------
// Capacity
// ---------------------------------------------------------------------------

/**
 * Seats consumed by accepted requests against a target.
 *
 * Sums party size. This is the fix for the overbooking bug and the reason
 * capacity is derived rather than stored — a stored counter and a list of
 * accepted requests can disagree, and when they do the seats are already gone.
 */
export function seatsTaken(
  requests: readonly AccessRequest[],
  target: { tableId: TableId } | { afterId: AfterPartyId },
): number {
  return requests
    .filter((r) => {
      if (r.status !== 'accepted') return false;
      return 'tableId' in target ? r.tableId === target.tableId : r.afterId === target.afterId;
    })
    .reduce((sum, r) => sum + r.partySize, 0);
}

export function tableSeatsLeft(
  table: TableOffer,
  requests: readonly AccessRequest[],
): number {
  return Math.max(0, table.seats - seatsTaken(requests, { tableId: table.id }));
}

export function afterGoingCount(
  after: AfterParty,
  requests: readonly AccessRequest[],
): number {
  return after.baseGoing + seatsTaken(requests, { afterId: after.id });
}

export function afterSpacesLeft(
  after: AfterParty,
  requests: readonly AccessRequest[],
): number {
  return Math.max(0, after.capacity - afterGoingCount(after, requests));
}

// ---------------------------------------------------------------------------
// Sending a request
// ---------------------------------------------------------------------------

export type RequestTarget =
  | { readonly kind: 'table'; readonly table: TableOffer }
  | { readonly kind: 'after'; readonly after: AfterParty };

export interface SendRequestInput {
  readonly guestId: PersonId;
  readonly partySize: number;
  readonly target: RequestTarget;
  /** All requests in the system; filtered internally. */
  readonly existingRequests: readonly AccessRequest[];
  readonly guestIsPremium: boolean;
  readonly newRequestId: RequestId;
  readonly newThreadId: ThreadId;
}

export interface SendRequestOutput {
  readonly request: AccessRequest;
  readonly threadId: ThreadId;
}

export function hostOf(target: RequestTarget): ActorId {
  return target.kind === 'table' ? target.table.businessId : target.after.hostId;
}

export function sendRequest(
  input: SendRequestInput,
  clock: Clock,
): Result<SendRequestOutput> {
  const { guestId, partySize, target, existingRequests } = input;

  if (!isValidPartySize(partySize)) return fail('invalid_party_size');

  const hostId = hostOf(target);
  // A host requesting their own listing would consume a real seat against
  // nobody, and could then trivially accept themselves.
  if (sameActor(hostId, guestId)) return fail('own_listing');

  const pending = existingRequests.filter(
    (r) => r.guestId === guestId && r.status === 'pending',
  );

  if (!input.guestIsPremium && pending.length >= FREE_PENDING_CAP) {
    return fail('request_cap');
  }

  const duplicate = pending.some((r) =>
    target.kind === 'table' ? r.tableId === target.table.id : r.afterId === target.after.id,
  );
  if (duplicate) return fail('duplicate');

  const now = clock.now();
  const request: AccessRequest = {
    id: input.newRequestId,
    kind: target.kind,
    guestId,
    hostId,
    partySize,
    venueId: target.kind === 'table' ? target.table.venueId : null,
    tableId: target.kind === 'table' ? target.table.id : null,
    afterId: target.kind === 'after' ? target.after.id : null,
    status: 'pending',
    createdAt: now,
    respondedAt: null,
    declineReason: null,
    passId: null,
    threadId: input.newThreadId,
  };

  return ok({ request, threadId: input.newThreadId });
}

// ---------------------------------------------------------------------------
// Accepting
// ---------------------------------------------------------------------------

export interface AcceptRequestInput {
  readonly request: AccessRequest;
  readonly actingAs: ActorId;
  readonly target: RequestTarget;
  readonly allRequests: readonly AccessRequest[];
  readonly newPassId: PassId;
  /** Sequence used to mint the pass code; supplied by the caller. */
  readonly passSequence: number;
}

export interface AcceptRequestOutput {
  readonly request: AccessRequest;
  /** After-parties issue no pass — the address is the thing you get. */
  readonly pass: Pass | null;
  /** Revealed to the guest at this moment, and not before. */
  readonly revealedAddress: string | null;
  /** The guest's nights-out counter should advance by one. */
  readonly incrementNightsFor: PersonId;
}

export function passCode(sequence: number): string {
  return `FNC-${4820 + sequence}`;
}

export function acceptRequest(
  input: AcceptRequestInput,
  clock: Clock,
): Result<AcceptRequestOutput> {
  const { request, actingAs, target, allRequests } = input;

  if (request.status !== 'pending') return fail('already_resolved');
  if (!sameActor(actingAs, request.hostId)) return fail('not_authorized');
  // Re-checked here and not only at creation: a self-request could already be
  // sitting in storage from before the create-time guard existed, and accept is
  // where the seat is actually consumed.
  if (sameActor(request.guestId, request.hostId)) return fail('own_listing');

  // Exclude this request from the tally — it is not accepted yet.
  const others = allRequests.filter((r) => r.id !== request.id);
  const remaining =
    target.kind === 'table'
      ? tableSeatsLeft(target.table, others)
      : afterSpacesLeft(target.after, others);

  if (request.partySize > remaining) return fail('at_capacity');

  const now = clock.now();
  const pass: Pass | null =
    request.kind === 'table' && request.venueId
      ? {
          id: input.newPassId,
          requestId: request.id,
          guestId: request.guestId,
          partySize: request.partySize,
          venueId: request.venueId,
          tableId: request.tableId,
          code: passCode(input.passSequence),
          issuedAt: now,
          status: 'active',
          rated: false,
        }
      : null;

  return ok({
    request: {
      ...request,
      status: 'accepted',
      respondedAt: now,
      passId: pass ? pass.id : null,
    },
    pass,
    // Safety and exclusivity in one mechanic — this is the only place the
    // address ever leaves the after-party record.
    revealedAddress: target.kind === 'after' ? target.after.address : null,
    incrementNightsFor: request.guestId,
  });
}

// ---------------------------------------------------------------------------
// Declining and cancelling
// ---------------------------------------------------------------------------

export function declineRequest(
  request: AccessRequest,
  actingAs: ActorId,
  reason: string | null,
  clock: Clock,
): Result<AccessRequest> {
  if (request.status !== 'pending') return fail('already_resolved');
  if (actingAs !== request.hostId) return fail('not_authorized');
  return ok({
    ...request,
    status: 'declined',
    respondedAt: clock.now(),
    declineReason: reason,
  });
}

export function cancelRequest(
  request: AccessRequest,
  actingAs: PersonId,
  clock: Clock,
): Result<AccessRequest> {
  if (request.status !== 'pending') return fail('already_resolved');
  if (actingAs !== request.guestId) return fail('not_authorized');
  return ok({ ...request, status: 'cancelled', respondedAt: clock.now() });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const requestsForGuest = (
  requests: readonly AccessRequest[],
  guestId: PersonId,
): readonly AccessRequest[] => requests.filter((r) => r.guestId === guestId);

export const pendingForHost = (
  requests: readonly AccessRequest[],
  hostId: ActorId,
): readonly AccessRequest[] =>
  requests.filter((r) => r.hostId === hostId && r.status === 'pending');

export const passesForGuest = (
  passes: readonly Pass[],
  guestId: PersonId,
): readonly Pass[] => passes.filter((p) => p.guestId === guestId);

/**
 * Whether the guest may see an after-party's address.
 *
 * Expressed as a query so that reveal is decided in one place, the same way
 * location visibility is. A screen must never read `after.address` directly.
 */
export function canSeeAfterAddress(
  after: AfterParty,
  viewer: PersonId,
  requests: readonly AccessRequest[],
): boolean {
  if (after.hostId === viewer) return true;
  return requests.some(
    (r) => r.afterId === after.id && r.guestId === viewer && r.status === 'accepted',
  );
}
