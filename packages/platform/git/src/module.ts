import type { IWorkspaceKernel } from '@unify/kernel';
import { GitServiceToken } from './types';
import { GitService } from './GitService';

export function registerGitServices(kernel: IWorkspaceKernel): void {
  kernel.register(GitServiceToken, () => new GitService(), 'singleton');
}
