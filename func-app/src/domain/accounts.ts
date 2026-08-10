/**
 * Accounts, identity and the 18+ gate.
 *
 * Tier 0: func is 18+ with government-ID verification. That makes the age check
 * a compliance rule rather than a feature, and it is why every uncertain path
 * in this file fails **closed**. The prototype originally defaulted an
 * unparseable date of birth to "adult" and let the account through; that is the
 * single worst bug found in the whole bug hunt, and the shape of it — a
 * permissive default on a safety check — is what these functions are written to
 * make impossible.
 */

import type { Clock, Timestamp } from './clock';
import type { ActorId, BusinessId, PersonId } from './ids';

export const MINIMUM_AGE = 18;

export type AccountRole = 'consumer' | 'business';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type VerificationMethod = 'id_upload' | 'id_scan';

export interface Verification {
  readonly status: VerificationStatus;
  readonly method: VerificationMethod | null;
  readonly submittedAt: Timestamp | null;
  readonly resolvedAt: Timestamp | null;
  /** Set only on rejection, so the UI can explain rather than just refuse. */
  readonly rejectionReason: RejectionReason | null;
}

export type RejectionReason = 'under_age' | 'unreadable_document' | 'age_indeterminate';

export interface Account {
  readonly id: ActorId;
  readonly role: AccountRole;
  /** Set iff role === 'business'; equal to `id`, per the single-actor rule. */
  readonly businessId: BusinessId | null;
  readonly email: string | null;
  readonly phone: string | null;
  /** ISO date, consumers only. Businesses have no birthday. */
  readonly dateOfBirth: string | null;
  readonly verification: Verification;
  readonly profileComplete: boolean;
  readonly onboardingComplete: boolean;
  readonly premium: boolean;
  readonly createdAt: Timestamp;
}

export const UNVERIFIED: Verification = {
  status: 'unverified',
  method: null,
  submittedAt: null,
  resolvedAt: null,
  rejectionReason: null,
};

// ---------------------------------------------------------------------------
// Age
// ---------------------------------------------------------------------------

/**
 * Whole years between a date of birth and an instant, or null if undeterminable.
 *
 * Real calendar arithmetic, not a 365.25-day average. The average divisor drifts
 * by however many leap days fall inside a person's span, which flips the floored
 * result a day early or late around their actual birthday — and "a day early" on
 * an 18+ gate is a compliance failure, not a rounding detail.
 *
 * Returns null rather than a number for anything it cannot determine. Callers
 * must treat null as "not an adult".
 */
export function ageInYears(dateOfBirth: string | null, at: Timestamp): number | null {
  if (!dateOfBirth) return null;
  const born = Date.parse(dateOfBirth);
  if (Number.isNaN(born)) return null;
  if (born > at) return null; // born in the future — nonsense input, not age 0

  const b = new Date(born);
  const n = new Date(at);
  let age = n.getUTCFullYear() - b.getUTCFullYear();
  const beforeBirthday =
    n.getUTCMonth() < b.getUTCMonth() ||
    (n.getUTCMonth() === b.getUTCMonth() && n.getUTCDate() < b.getUTCDate());
  if (beforeBirthday) age -= 1;

  return age;
}

/**
 * The gate itself.
 *
 * Written as an explicit allow-list of the one passing case so that every other
 * outcome — null, NaN, negative, undefined-by-way-of-bad-data — is a refusal by
 * construction rather than by omission.
 */
export function meetsMinimumAge(dateOfBirth: string | null, at: Timestamp): boolean {
  const age = ageInYears(dateOfBirth, at);
  return age !== null && age >= MINIMUM_AGE;
}

// ---------------------------------------------------------------------------
// Creating accounts
// ---------------------------------------------------------------------------

export interface CreateAccountInput {
  readonly id: ActorId;
  readonly role: AccountRole;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly dateOfBirth?: string | null;
}

export function createAccount(input: CreateAccountInput, clock: Clock): Account {
  const isBusiness = input.role === 'business';
  return {
    id: input.id,
    role: input.role,
    businessId: isBusiness ? (input.id as BusinessId) : null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    dateOfBirth: isBusiness ? null : (input.dateOfBirth ?? null),
    verification: UNVERIFIED,
    profileComplete: false,
    onboardingComplete: false,
    premium: false,
    createdAt: clock.now(),
  };
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export function submitVerification(
  account: Account,
  method: VerificationMethod,
  clock: Clock,
): Account {
  return {
    ...account,
    verification: {
      status: 'pending',
      method,
      submittedAt: clock.now(),
      resolvedAt: null,
      rejectionReason: null,
    },
  };
}

/**
 * The outcome an identity provider reports back.
 *
 * `documentAge` is what the provider read off the document, which may disagree
 * with what the user typed at signup. When it does, the **document** wins —
 * self-reported dates of birth are not evidence.
 */
export interface VerificationEvidence {
  readonly documentReadable: boolean;
  readonly documentDateOfBirth: string | null;
}

/**
 * Resolve a pending verification.
 *
 * Businesses have no age to check, so they pass on document readability alone.
 * Consumers must produce a readable document **and** a determinable date of
 * birth that clears the minimum. Anything else is a rejection with a reason.
 */
export function resolveVerification(
  account: Account,
  evidence: VerificationEvidence,
  clock: Clock,
): Account {
  if (account.verification.status !== 'pending') return account;

  const now = clock.now();
  const settle = (
    status: 'verified' | 'rejected',
    rejectionReason: RejectionReason | null,
  ): Account => ({
    ...account,
    verification: { ...account.verification, status, resolvedAt: now, rejectionReason },
  });

  if (!evidence.documentReadable) return settle('rejected', 'unreadable_document');

  if (account.role === 'business') return settle('verified', null);

  const dob = evidence.documentDateOfBirth;
  if (dob === null || ageInYears(dob, now) === null) {
    return settle('rejected', 'age_indeterminate');
  }
  if (!meetsMinimumAge(dob, now)) return settle('rejected', 'under_age');

  return settle('verified', null);
}

/**
 * May this account use func at all?
 *
 * The single question every gated surface should ask. A rejected account stays
 * rejected — it is not retried into existence by reloading the app.
 */
export function canEnter(account: Account): boolean {
  return account.verification.status === 'verified';
}

/** Rejected for age is terminal; the other reasons are worth another attempt. */
export function mayRetryVerification(account: Account): boolean {
  return (
    account.verification.status === 'rejected' &&
    account.verification.rejectionReason !== 'under_age'
  );
}

// ---------------------------------------------------------------------------
// Profile and lifecycle
// ---------------------------------------------------------------------------

export interface Profile {
  readonly personId: PersonId;
  readonly name: string;
  readonly bio: string;
  readonly instagram: string | null;
  readonly photoUris: readonly string[];
  /** Earned by other people visiting spots this person dropped. */
  readonly tokens: number;
  readonly spotsDropped: number;
  readonly nightsOut: number;
}

export const markProfileComplete = (account: Account): Account => ({
  ...account,
  profileComplete: true,
});

export const markOnboardingComplete = (account: Account): Account => ({
  ...account,
  onboardingComplete: true,
});

export const setPremium = (account: Account, premium: boolean): Account => ({
  ...account,
  premium,
});

/**
 * Where a signed-in account should land.
 *
 * Ordering matters and is deliberate: verification comes before profile, so
 * nobody builds out a profile the age gate is about to reject.
 */
export type OnboardingStep =
  | 'verify'
  | 'blocked'
  | 'awaiting_verification'
  | 'profile'
  | 'onboarding'
  | 'ready';

export function nextStep(account: Account): OnboardingStep {
  switch (account.verification.status) {
    case 'unverified':
      return 'verify';
    case 'pending':
      return 'awaiting_verification';
    case 'rejected':
      return mayRetryVerification(account) ? 'verify' : 'blocked';
    case 'verified':
      break;
  }
  if (!account.profileComplete) return 'profile';
  if (!account.onboardingComplete) return 'onboarding';
  return 'ready';
}
