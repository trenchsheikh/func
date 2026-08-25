import type { Snapshot } from '../repository';
import { buildInvites, buildMessaging, buildStories } from './invites';
import { ME, buildUsers } from './users';
import { FRIENDSHIPS } from './relationships';
import { SEED_VENUES } from './venues';

/** Pristine demo state, relative to `now` so live-status ages read correctly. */
export function buildSeed(now: Date): Snapshot {
  const { users, groups } = buildUsers(now);
  const { invites, threads: poolThreads } = buildInvites(now);
  const { threads: dmThreads, messageRequests } = buildMessaging(now);
  return {
    currentUserId: ME,
    users,
    groups,
    friendships: FRIENDSHIPS,
    venues: SEED_VENUES,
    invites,
    threads: [...dmThreads, ...poolThreads],
    messageRequests,
    stories: buildStories(now),
  };
}
