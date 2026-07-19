import type { IWorkspaceKernel } from '@unify/kernel';
import { WorkspaceMemoryToken } from './types';
import { ProjectMemory } from './ProjectMemory';

export function registerMemoryServices(kernel: IWorkspaceKernel, workspaceRoot: string): void {
  kernel.register(WorkspaceMemoryToken, () => new ProjectMemory(workspaceRoot), 'singleton');
}
