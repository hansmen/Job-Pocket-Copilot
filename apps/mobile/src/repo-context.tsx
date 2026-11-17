import { createContext, useContext, type ReactNode } from 'react';
import type { JobRepository } from '@jc/shared';

const RepoContext = createContext<JobRepository | null>(null);

export function RepoProvider({ repo, children }: { repo: JobRepository; children: ReactNode }) {
  return <RepoContext.Provider value={repo}>{children}</RepoContext.Provider>;
}

/** The UI gets the repository via context: in Stage 2 you can swap SQLite for the API without changing screens. */
export function useRepo(): JobRepository {
  const repo = useContext(RepoContext);
  if (!repo) throw new Error('useRepo called outside RepoProvider');
  return repo;
}
