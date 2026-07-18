/**
 * ServiceContainer — Typed dependency injection container.
 *
 * Inspired by .NET's IServiceCollection / IServiceProvider.
 * Services are registered with a factory and scope (singleton or transient).
 * Singletons are created once and cached. Transients are created fresh each time.
 */

import type { Disposable, IServiceContainer, ServiceDescriptor, ServiceScope, ServiceToken } from './types';

export class ServiceContainer implements IServiceContainer {
  private readonly _registry = new Map<string, ServiceDescriptor<unknown>>();
  private _disposed = false;

  register<T>(token: ServiceToken<T>, factory: () => T, scope: ServiceScope = 'singleton'): void {
    this._ensureNotDisposed();

    this._registry.set(token.id, {
      token: token as ServiceToken<unknown>,
      factory,
      scope,
      instance: undefined,
    });
  }

  resolve<T>(token: ServiceToken<T>): T {
    this._ensureNotDisposed();

    const descriptor = this._registry.get(token.id);
    if (!descriptor) {
      throw new Error(`[ServiceContainer] Service not registered: "${token.id}"`);
    }

    if (descriptor.scope === 'singleton') {
      if (descriptor.instance === undefined) {
        descriptor.instance = descriptor.factory();
      }
      return descriptor.instance as T;
    }

    // Transient — create new instance each time
    return descriptor.factory() as T;
  }

  tryResolve<T>(token: ServiceToken<T>): T | undefined {
    try {
      return this.resolve(token);
    } catch {
      return undefined;
    }
  }

  has(token: ServiceToken<unknown>): boolean {
    return this._registry.has(token.id);
  }

  dispose(): void {
    if (this._disposed) return;

    // Dispose all singleton instances that implement Disposable
    for (const descriptor of this._registry.values()) {
      if (
        descriptor.scope === 'singleton' &&
        descriptor.instance != null &&
        typeof (descriptor.instance as Disposable).dispose === 'function'
      ) {
        (descriptor.instance as Disposable).dispose();
      }
    }

    this._registry.clear();
    this._disposed = true;
  }

  private _ensureNotDisposed(): void {
    if (this._disposed) {
      throw new Error('[ServiceContainer] Cannot use a disposed container.');
    }
  }
}
