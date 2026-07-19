import type { Disposable, ServiceToken } from '@unify/kernel';
import { createServiceToken } from '@unify/kernel/src/types';

export interface GitStatus {
  isClean: boolean;
  modifiedFiles: string[];
  untrackedFiles: string[];
  stagedFiles: string[];
}

export interface IGitService {
  getCurrentBranch(repoPath: string): Promise<string | null>;
  getStatus(repoPath: string): Promise<GitStatus | null>;
}

export const GitServiceToken: ServiceToken<IGitService> = createServiceToken<IGitService>('git.service', 'Git Service');
