/**
 * EventBus — Enterprise-grade typed pub/sub event system.
 *
 * Features:
 * - Priority-based handler ordering
 * - Async handler support
 * - Cancellable events
 * - Sticky events (late subscribers receive last value)
 * - Namespaced event buses
 * - Middleware pipeline
 */

import type { Disposable } from '@unify/kernel';
import type {
  CancellationResult,
  EventHandler,
  EventMiddleware,
  EventOptions,
  IEventBus,
} from './types';

interface HandlerEntry {
  handler: EventHandler<unknown>;
  priority: number;
  once: boolean;
  disposable: Disposable;
}

export class EventBus implements IEventBus {
  private readonly _handlers = new Map<string, HandlerEntry[]>();
  private readonly _stickyValues = new Map<string, unknown>();
  private readonly _middlewares: EventMiddleware[] = [];
  private readonly _prefix: string;
  private _disposed = false;

  constructor(prefix = '') {
    this._prefix = prefix;
  }

  on<T>(event: string, handler: EventHandler<T>, options?: EventOptions): Disposable {
    this._ensureNotDisposed();
    const fullEvent = this._fullEvent(event);
    const priority = options?.priority ?? 0;
    const once = options?.once ?? false;

    if (!this._handlers.has(fullEvent)) {
      this._handlers.set(fullEvent, []);
    }

    const entry: HandlerEntry = {
      handler: handler as EventHandler<unknown>,
      priority,
      once,
      disposable: { dispose: () => {} }, // Set below
    };

    const disposable: Disposable = {
      dispose: () => {
        const handlers = this._handlers.get(fullEvent);
        if (handlers) {
          const idx = handlers.indexOf(entry);
          if (idx !== -1) handlers.splice(idx, 1);
          if (handlers.length === 0) this._handlers.delete(fullEvent);
        }
      },
    };

    entry.disposable = disposable;

    const handlers = this._handlers.get(fullEvent)!;
    handlers.push(entry);
    // Sort by priority descending — higher priority runs first
    handlers.sort((a, b) => b.priority - a.priority);

    // If there's a sticky value, immediately invoke
    if (this._stickyValues.has(fullEvent)) {
      const stickyData = this._stickyValues.get(fullEvent);
      (handler as EventHandler<unknown>)(stickyData);
    }

    return disposable;
  }

  once<T>(event: string, handler: EventHandler<T>): Disposable {
    return this.on(event, handler, { once: true });
  }

  async emit<T>(event: string, data: T): Promise<void> {
    this._ensureNotDisposed();
    const fullEvent = this._fullEvent(event);

    // Run through middleware pipeline
    const runHandlers = async () => {
      const handlers = this._handlers.get(fullEvent);
      if (!handlers || handlers.length === 0) return;

      const toRemove: HandlerEntry[] = [];

      for (const entry of [...handlers]) {
        try {
          await entry.handler(data);
        } catch (err) {
          console.error(`[EventBus] Error in handler for "${fullEvent}":`, err);
        }

        if (entry.once) {
          toRemove.push(entry);
        }
      }

      // Remove once-handlers
      for (const entry of toRemove) {
        entry.disposable.dispose();
      }
    };

    await this._runMiddleware(fullEvent, data, runHandlers);
  }

  async emitCancellable<T>(event: string, data: T): Promise<CancellationResult<T>> {
    this._ensureNotDisposed();
    const fullEvent = this._fullEvent(event);
    const result: CancellationResult<T> = { cancelled: false, data };

    const handlers = this._handlers.get(fullEvent);
    if (!handlers || handlers.length === 0) return result;

    for (const entry of [...handlers]) {
      try {
        const returnValue = await entry.handler(data);
        // If handler returns false, treat as cancellation
        if (returnValue === false) {
          result.cancelled = true;
          result.cancelledBy = fullEvent;
          return result;
        }
      } catch (err) {
        console.error(`[EventBus] Error in cancellable handler for "${fullEvent}":`, err);
      }
    }

    return result;
  }

  emitSticky<T>(event: string, data: T): void {
    this._ensureNotDisposed();
    const fullEvent = this._fullEvent(event);
    this._stickyValues.set(fullEvent, data);
    // Also emit to current subscribers
    void this.emit(event, data);
  }

  off(disposable: Disposable): void {
    disposable.dispose();
  }

  use(middleware: EventMiddleware): Disposable {
    this._ensureNotDisposed();
    this._middlewares.push(middleware);
    return {
      dispose: () => {
        const idx = this._middlewares.indexOf(middleware);
        if (idx !== -1) this._middlewares.splice(idx, 1);
      },
    };
  }

  namespace(ns: string): IEventBus {
    const separator = this._prefix ? '.' : '';
    return new EventBus(`${this._prefix}${separator}${ns}`);
  }

  getSubscriberCount(event: string): number {
    const fullEvent = this._fullEvent(event);
    return this._handlers.get(fullEvent)?.length ?? 0;
  }

  getRegisteredEvents(): string[] {
    return Array.from(this._handlers.keys());
  }

  dispose(): void {
    if (this._disposed) return;
    this._handlers.clear();
    this._stickyValues.clear();
    this._middlewares.length = 0;
    this._disposed = true;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private _fullEvent(event: string): string {
    return this._prefix ? `${this._prefix}.${event}` : event;
  }

  private async _runMiddleware(
    event: string,
    data: unknown,
    final: () => Promise<void>
  ): Promise<void> {
    if (this._middlewares.length === 0) {
      await final();
      return;
    }

    let index = 0;
    const next = async (): Promise<void> => {
      if (index < this._middlewares.length) {
        const mw = this._middlewares[index++]!;
        await mw.handle(event, data, next);
      } else {
        await final();
      }
    };

    await next();
  }

  private _ensureNotDisposed(): void {
    if (this._disposed) {
      throw new Error('[EventBus] Cannot use a disposed EventBus.');
    }
  }
}
