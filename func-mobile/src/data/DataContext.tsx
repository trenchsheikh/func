import React, { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import type { FuncRepository, Snapshot } from './repository';
import { InMemoryRepository } from './InMemoryRepository';
import { buildSeed } from './seed';

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

export function useRepository(): FuncRepository {
  const repo = useContext(RepositoryContext);
  if (!repo) throw new Error('useRepository must be used inside <DataProvider>');
  return repo;
}

/** The whole snapshot; re-renders on any mutation. Fine at prototype scale. */
export function useSnapshot(): Snapshot {
  const repo = useRepository();
  return useSyncExternalStore(repo.subscribe.bind(repo), repo.getSnapshot.bind(repo), repo.getSnapshot.bind(repo));
}
