/**
 * @unify/kernel
 *
 * The Workspace Kernel is the central nervous system of Unify.AI.
 * It manages the Service Container, Workspace Lifecycle, and bootstrapping.
 *
 * Every service in the platform resolves through the Kernel.
 * No module should instantiate services directly.
 */

// Core
export { WorkspaceKernel } from './WorkspaceKernel';
export { ServiceContainer } from './ServiceContainer';
export { WorkspaceLifecycle, WorkspacePhase } from './WorkspaceLifecycle';

// Types
export type {
  ServiceToken,
  ServiceDescriptor,
  ServiceScope,
  Disposable,
  IWorkspaceKernel,
  IServiceContainer,
  IWorkspaceLifecycle,
} from './types';
