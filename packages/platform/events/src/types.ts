/**
 * @unify/platform-events
 *
 * Enterprise-grade Event Bus with priority, async, cancellation,
 * sticky events, namespaces, and middleware support.
 */

import type { Disposable } from '@unify/kernel';

// ---------------------------------------------------------------------------
// Event Handler
// ---------------------------------------------------------------------------

export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

// ---------------------------------------------------------------------------
// Event Options
// ---------------------------------------------------------------------------

export interface EventOptions {
  /** Higher priority handlers run first. Default: 0 */
  priority?: number;
  /** If true, handler is automatically removed after first invocation. */
  once?: boolean;
}

// ---------------------------------------------------------------------------
// Cancellation
// ---------------------------------------------------------------------------

export interface CancellationResult<T = unknown> {
  cancelled: boolean;
  data: T;
  cancelledBy?: string;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export interface EventMiddleware {
  name: string;
  handle(event: string, data: unknown, next: () => Promise<void>): Promise<void>;
}

// ---------------------------------------------------------------------------
// Event Bus Interface
// ---------------------------------------------------------------------------

export interface IEventBus {
  // Core pub/sub
  on<T>(event: string, handler: EventHandler<T>, options?: EventOptions): Disposable;
  once<T>(event: string, handler: EventHandler<T>): Disposable;
  emit<T>(event: string, data: T): Promise<void>;
  off(disposable: Disposable): void;

  // Advanced
  emitCancellable<T>(event: string, data: T): Promise<CancellationResult<T>>;
  emitSticky<T>(event: string, data: T): void;

  // Middleware
  use(middleware: EventMiddleware): Disposable;

  // Namespaces
  namespace(ns: string): IEventBus;

  // Debugging
  getSubscriberCount(event: string): number;
  getRegisteredEvents(): string[];

  // Lifecycle
  dispose(): void;
}
