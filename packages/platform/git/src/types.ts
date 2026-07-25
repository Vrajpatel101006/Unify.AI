import { createServiceToken, type ServiceToken } from '@unify/kernel';

export interface GitStatus {
  isClean: boolean;
  modifiedFiles: string[];
  untrackedFiles: string[];
  stagedFiles: string[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface IGitService {
  getCurrentBranch(repoPath: string): Promise<string | null>;
  getStatus(repoPath: string): Promise<GitStatus | null>;
  getHistory(repoPath: string, limit?: number): Promise<GitCommit[]>;
  getDiff(repoPath: string, stagedOnly?: boolean): Promise<string>;
  commit(repoPath: string, message: string, files: string[]): Promise<void>;
  push(repoPath: string): Promise<void>;
  pull(repoPath: string): Promise<void>;
  clone(url: string, destPath: string): Promise<void>;
}

export const GitServiceToken: ServiceToken<IGitService> = createServiceToken<IGitService>('git.service', 'Git Service');
