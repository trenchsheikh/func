import type { FuncUser, Group } from '@/domain/types';

export const ME = 'u_maya';

/** `photo` is an avatar descriptor in the prototype: `mono:<hex>` renders a monogram. */
type UserSeed = {
  id: string;
  handle: string;
  name: string;
  color: string;
  status: 'dtf' | 'casual' | 'off';
  premium: boolean;
  /** hours ago for the last known location fix; undefined = no fix at all */
  agoHours?: number;
  at?: { lat: number; lng: number };
  business?: { venueName: string; active?: boolean };
  /** Other users in this person's party tonight. */
  party?: string[];
};

const SEEDS: UserSeed[] = [
  // the current user — personal by default, owns a bar as a secondary profile
  { id: ME, handle: 'maya', name: 'Maya', color: '#c084fc', status: 'casual', premium: false, agoHours: 0.2, at: { lat: 37.7601, lng: -122.4201 }, business: { venueName: 'The Velvet Lantern' }, party: ['u_ines'] },

  { id: 'u_theo', handle: 'theo.v', name: 'Theo', color: '#f97316', status: 'dtf', premium: true, agoHours: 0.1, at: { lat: 37.7623, lng: -122.4247 }, party: ['u_priya'] },
  { id: 'u_priya', handle: 'priyaaa', name: 'Priya', color: '#ec4899', status: 'dtf', premium: false, agoHours: 0.3, at: { lat: 37.7770, lng: -122.4075 } },
  { id: 'u_luca', handle: 'lucabeats', name: 'Luca', color: '#38bdf8', status: 'casual', premium: true, agoHours: 0.5, at: { lat: 37.7761, lng: -122.4251 }, party: ['u_rosa'] },
  { id: 'u_noor', handle: 'noor', name: 'Noor', color: '#a3e635', status: 'dtf', premium: false, agoHours: 0.1, at: { lat: 37.7615, lng: -122.4341 }, party: ['u_sasha', 'u_jun'] },
  { id: 'u_dev', handle: 'dev_patel', name: 'Dev', color: '#fbbf24', status: 'off', premium: false, agoHours: 3, at: { lat: 37.8003, lng: -122.4091 } },
  { id: 'u_sasha', handle: 'sashh', name: 'Sasha', color: '#f472b6', status: 'casual', premium: false, agoHours: 1.2, at: { lat: 37.8019, lng: -122.4360 }, party: ['u_dev'] },
  { id: 'u_jun', handle: 'jun.k', name: 'Jun', color: '#2dd4bf', status: 'off', premium: false, agoHours: 20, at: { lat: 37.7927, lng: -122.4165 } },
  { id: 'u_amara', handle: 'amara', name: 'Amara', color: '#fb7185', status: 'dtf', premium: false, agoHours: 0.4, at: { lat: 37.7580, lng: -122.3892 } },
  // 60h old fix — beyond the 48h window, must be hidden from the map
  { id: 'u_felix', handle: 'felixx', name: 'Felix', color: '#94a3b8', status: 'off', premium: false, agoHours: 60, at: { lat: 37.7850, lng: -122.4300 } },
  { id: 'u_rosa', handle: 'rosa.m', name: 'Rosa', color: '#e879f9', status: 'casual', premium: true, agoHours: 0.8, at: { lat: 37.7849, lng: -122.4172 }, party: ['u_felix'] },
  { id: 'u_kai', handle: 'kai', name: 'Kai', color: '#34d399', status: 'dtf', premium: true, agoHours: 0.2, at: { lat: 37.7728, lng: -122.4118 } },
  // business account, currently switched into it — renders as a silver ball at the venue
  { id: 'u_wren', handle: 'audiowave', name: 'Wren', color: '#cbd5e1', status: 'off', premium: false, business: { venueName: 'Audiowave', active: true } },
  { id: 'u_ines', handle: 'ines', name: 'Inès', color: '#fde047', status: 'off', premium: true, agoHours: 5, at: { lat: 37.7690, lng: -122.4470 } },
];

export function buildUsers(now: Date): { users: FuncUser[]; groups: Group[] } {
  const users: FuncUser[] = SEEDS.map((s) => ({
    id: s.id,
    handle: s.handle,
    activeProfile: s.business?.active ? 'business' : 'personal',
    personalProfile: {
      displayName: s.name,
      photo: `mono:${s.color}`,
      liveStatus: s.status,
      premium: s.premium,
      ...(s.at && s.agoHours != null
        ? {
            lastKnownLocation: {
              lat: s.at.lat,
              lng: s.at.lng,
              timestamp: new Date(now.getTime() - s.agoHours * 3_600_000).toISOString(),
            },
          }
        : {}),
    },
    ...(s.business ? { businessProfile: { venueName: s.business.venueName } } : {}),
  }));

  // Every user leads exactly one party (group). Others may be along for the night.
  const groups: Group[] = SEEDS.map((s) => ({
    id: groupIdFor(s.id),
    leadUserId: s.id,
    memberUserIds: [s.id, ...(s.party ?? [])],
  }));

  return { users, groups };
}

export function groupIdFor(userId: string): string {
  return `g_${userId.replace(/^u_/, '')}`;
}
