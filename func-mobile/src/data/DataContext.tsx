import React, { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import type { FuncCommands, FuncRepository, Snapshot } from './repository';
import { InMemoryRepository } from './InMemoryRepository';
import type { DemoControls } from './demo';
import { buildSeed } from './seed';
import { viewFor, type ViewerSnapshot } from './views';
import { useNow } from '@/ui/time';

const RepositoryContext = createContext<FuncRepository | null>(null);

/**
 * Wires the repository into React. Swap `InMemoryRepository` for a real one
 * here and nothing below this line in the tree has to change.
 */
export function DataProvider({
  children,
  repository,
}: {
  children: React.ReactNode;
  repository?: FuncRepository;
}) {
  const repo = useMemo(() => repository ?? new InMemoryRepository(buildSeed), [repository]);
  return <RepositoryContext.Provider value={repo}>{children}</RepositoryContext.Provider>;
}

function useRepository(): FuncRepository {
  const repo = useContext(RepositoryContext);
  if (!repo) throw new Error('useRepository must be used inside <DataProvider>');
  return repo;
}

/** The whole snapshot; re-renders on any mutation. Fine at prototype scale. */
function useSnapshot(): Snapshot {
  const repo = useRepository();
  return useSyncExternalStore(repo.subscribe.bind(repo), repo.getSnapshot.bind(repo), repo.getSnapshot.bind(repo));
}

/** The current viewer's audience-filtered view of the world. Recomputes on every mutation and once a minute for expiry. */
export function useView(): ViewerSnapshot {
  const snapshot = useSnapshot();
  const now = useNow();
  return useMemo(() => viewFor(snapshot, now), [snapshot, now]);
}

/** The command surface the UI may call. */
export function useCommands(): FuncCommands {
  const repo = useRepository();
  return useMemo(
    () => ({
      setLiveStatus: repo.setLiveStatus.bind(repo),
      switchProfile: repo.switchProfile.bind(repo),
      createInvite: repo.createInvite.bind(repo),
      joinInvite: repo.joinInvite.bind(repo),
      requestToJoin: repo.requestToJoin.bind(repo),
      reviewRequest: repo.reviewRequest.bind(repo),
      sendMessage: repo.sendMessage.bind(repo),
      respondToMessageRequest: repo.respondToMessageRequest.bind(repo),
      sendMessageRequest: repo.sendMessageRequest.bind(repo),
      postStory: repo.postStory.bind(repo),
      reset: repo.reset.bind(repo),
    }),
    [repo],
  );
}

/** Debug-only persona switching. Never available in production or against a non-mock repository. */
export function useDemoControls(): DemoControls | null {
  const repo = useContext(RepositoryContext);
  return __DEV__ && repo instanceof InMemoryRepository ? repo.demo : null;
}
