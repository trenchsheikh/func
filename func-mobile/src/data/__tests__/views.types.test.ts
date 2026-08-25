// src/data/__tests__/views.types.test.ts
// Compiled by `npm run typecheck` only -- this file asserts shapes, it has no runtime.
import type { InviteCardView, InviteDetailView, PersonSummary, ViewerSnapshot } from '../views';
import type { PoolInvite, FuncUser, Group } from '@/domain/types';

declare const card: InviteCardView;
// @ts-expect-error -- InviteCardView must not expose the raw requests array
card.requests;
// @ts-expect-error
card.attendeeGroupIds;
// @ts-expect-error
card.groupChatId;
// @ts-expect-error
card.hostGroupId;
// @ts-expect-error
card.location;
// @ts-expect-error
card.createdByAccountType;

declare const person: PersonSummary;
// @ts-expect-error -- PersonSummary must never carry the raw personalProfile
person.personalProfile;
// @ts-expect-error
person.lastKnownLocation;
// @ts-expect-error
person.liveStatusSince;
// @ts-expect-error
person.liveStatusExpiresAt;

declare const snap: ViewerSnapshot;
// @ts-expect-error -- ViewerSnapshot must never enumerate every user/group/friendship
snap.users;
// @ts-expect-error
snap.groups;
// @ts-expect-error
snap.friendships;

// A raw domain record must not be assignable to its whitelisted view.
declare const rawInvite: PoolInvite;
declare const rawUser: FuncUser;
declare const rawGroup: Group;
// @ts-expect-error
const _a: InviteCardView = rawInvite;
// @ts-expect-error
const _b: PersonSummary = rawUser;
// @ts-expect-error
const _c: import('../views').PartySummary = rawGroup;
