/**
 * WorkspaceKernel — The central entry point for the Unify.AI platform.
 *
 * Responsibilities:
 * - Owns the ServiceContainer (DI)
 * - Owns the WorkspaceLifecycle
 * - Bootstraps all platform services
 * - Provides shorthand access to resolve/register services
 *
 * Usage:
 *   const kernel = new WorkspaceKernel();
 *   kernel.register(MyServiceToken, () => new MyService());
 *   await kernel.boot();
 *   const svc = kernel.get(MyServiceToken);
 */

import { ServiceContainer } from './ServiceContainer';
import { WorkspaceLifecycle, WorkspacePhase } from './WorkspaceLifecycle';
import type { IWorkspaceKernel, ServiceScope, ServiceToken } from './types';
import { WorkspacePhaseEnum } from './types';

export class WorkspaceKernel implements IWorkspaceKernel {
  readonly container: ServiceContainer;
  readonly lifecycle: WorkspaceLifecycle;

  private _booted = false;

  constructor() {
    this.container = new ServiceContainer();
    this.lifecycle = new WorkspaceLifecycle();
  }

  async boot(): Promise<void> {
    if (this._booted) {
      throw new Error('[WorkspaceKernel] Kernel is already booted.');
    }

    await this.lifecycle.transitionTo(WorkspacePhaseEnum.Loading);

    // Platform services register themselves before boot is called.
    // Boot transitions through Loading → Ready.

    await this.lifecycle.transitionTo(WorkspacePhaseEnum.Ready);
    this._booted = true;
  }

  async shutdown(): Promise<void> {
    if (!this._booted) return;

    await this.lifecycle.transitionTo(WorkspacePhaseEnum.Saving);
    await this.lifecycle.transitionTo(WorkspacePhaseEnum.Closing);

    this.container.dispose();

    await this.lifecycle.transitionTo(WorkspacePhaseEnum.Disposed);
    this._booted = false;
  }

  isBooted(): boolean {
    return this._booted;
  }

  get<T>(token: ServiceToken<T>): T {
    return this.container.resolve(token);
  }

  register<T>(token: ServiceToken<T>, factory: () => T, scope?: ServiceScope): void {
    this.container.register(token, factory, scope);
  }
}
