/**
 * Core type definitions for the Unify.AI Kernel.
 *
 * These types form the foundation of the entire dependency injection
 * and lifecycle management system.
 */

// ---------------------------------------------------------------------------
// Disposable
// ---------------------------------------------------------------------------

/** A handle that can be disposed to release resources or unsubscribe. */
export interface Disposable {
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Service Container
// ---------------------------------------------------------------------------

/** Scope of a service registration. */
export type ServiceScope = 'singleton' | 'transient';

/** A typed token used to register and resolve services. */
export interface ServiceToken<T> {
  readonly id: string;
  readonly description?: string;
  /** Phantom field — never assigned at runtime, only used by TypeScript for type inference. */
  readonly _type?: T;
}

/** Creates a typed service token. */
export function createServiceToken<T>(id: string, description?: string): ServiceToken<T> {
  return { id, description };
}

/** Describes how a service is registered in the container. */
export interface ServiceDescriptor<T> {
  token: ServiceToken<T>;
  factory: () => T;
  scope: ServiceScope;
  instance?: T;
}

/** The Service Container interface — resolves dependencies like .NET DI. */
export interface IServiceContainer {
  register<T>(token: ServiceToken<T>, factory: () => T, scope?: ServiceScope): void;
  resolve<T>(token: ServiceToken<T>): T;
  tryResolve<T>(token: ServiceToken<T>): T | undefined;
  has(token: ServiceToken<unknown>): boolean;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Workspace Lifecycle
// ---------------------------------------------------------------------------

/** The lifecycle phases of a workspace. */
export enum WorkspacePhaseEnum {
  Opening = 'opening',
  Loading = 'loading',
  Ready = 'ready',
  Saving = 'saving',
  Closing = 'closing',
  Disposed = 'disposed',
}

/** Callback for lifecycle phase changes. */
export type PhaseChangeCallback = (phase: WorkspacePhaseEnum) => void;

/** The Workspace Lifecycle interface. */
export interface IWorkspaceLifecycle {
  getCurrentPhase(): WorkspacePhaseEnum;
  transitionTo(phase: WorkspacePhaseEnum): Promise<void>;
  onPhaseChange(callback: PhaseChangeCallback): Disposable;
}

// ---------------------------------------------------------------------------
// Workspace Kernel
// ---------------------------------------------------------------------------

/** The Workspace Kernel interface — the central entry point for the platform. */
export interface IWorkspaceKernel {
  readonly container: IServiceContainer;
  readonly lifecycle: IWorkspaceLifecycle;

  boot(): Promise<void>;
  shutdown(): Promise<void>;
  isBooted(): boolean;

  /** Shorthand for container.resolve */
  get<T>(token: ServiceToken<T>): T;

  /** Shorthand for container.register */
  register<T>(token: ServiceToken<T>, factory: () => T, scope?: ServiceScope): void;
}
