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

/** true iff liveStatus !== 'off' && since parses && since <= now && now < nextLocalNoon(since). */
export function isPresenceLive(p: PersonalProfile, now: Date): boolean {
  if (p.liveStatus === 'off') return false;
  const since = parseIso(p.liveStatusSince);
  if (!since) return false;
  if (since.getTime() > now.getTime()) return false;
  return now.getTime() < nextLocalNoon(since).getTime();
}

/** Live status is a personal-profile concept only. */
export function canUseLiveStatus(user: FuncUser): boolean {
  return user.activeProfile === 'personal';
}
