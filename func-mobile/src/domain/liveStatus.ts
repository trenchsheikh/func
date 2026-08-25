import type { FuncUser, PersonalProfile } from './types';

export function nextLocalNoon(from: Date): Date {
  const noon = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0, 0);
  if (from.getTime() >= noon.getTime()) {
    noon.setDate(noon.getDate() + 1);
  }
  return noon;
}

/** Strict canonical ISO-8601 UTC parsing: the parsed value must re-serialize to exactly the input string. Rejects any valid-but-non-canonical representation of the same instant. */
export function parseIso(iso: string | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString() === iso ? d : null;
}

/**
 * true iff liveStatus !== 'off', both `since` and `expires` parse as strict
 * canonical UTC ISO, since <= now < expires, and expires is after since.
 * `liveStatusExpiresAt` is stamped once at enable time (see
 * InMemoryRepository.setLiveStatus / seed/users.ts) -- it is never
 * recomputed from `liveStatusSince` here, so a missing, malformed, or
 * inconsistent expiry fails closed instead of silently re-deriving one.
 */
export function isPresenceLive(p: PersonalProfile, now: Date): boolean {
  if (p.liveStatus === 'off') return false;
  const since = parseIso(p.liveStatusSince);
  const expires = parseIso(p.liveStatusExpiresAt);
  if (!since || !expires) return false;
  if (expires.getTime() <= since.getTime()) return false;
  if (since.getTime() > now.getTime()) return false;
  return now.getTime() < expires.getTime();
}

/** Live status is a personal-profile concept only. */
export function canUseLiveStatus(user: FuncUser): boolean {
  return user.activeProfile === 'personal';
}
