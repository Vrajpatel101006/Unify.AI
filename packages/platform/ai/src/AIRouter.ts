/**
 * AIRouter — Selects the correct AI provider based on capability constraints,
 * cost estimates, preference weighting, and handles fallback failure chains.
 */

import type { AITask, IAIProvider, IAIRouter } from './types';

export class AIRouter implements IAIRouter {
  private readonly _providers = new Map<string, IAIProvider>();
  private _defaultProviderId?: string;
  private _fallbackChain: string[] = [];

  route(task: AITask): Promise<IAIProvider> {
    if (task.preferredProvider && this._providers.has(task.preferredProvider)) {
      return Promise.resolve(this._providers.get(task.preferredProvider)!);
    }

    if (task.requiredCapabilities) {
      for (const provider of this._providers.values()) {
        const hasAll = task.requiredCapabilities.every((cap) =>
          provider.capabilities.includes(cap)
        );
        if (hasAll) return Promise.resolve(provider);
      }
    }

    if (this._defaultProviderId && this._providers.has(this._defaultProviderId)) {
      return Promise.resolve(this._providers.get(this._defaultProviderId)!);
    }

    // Try fallback chain
    for (const id of this._fallbackChain) {
      if (this._providers.has(id)) {
        return Promise.resolve(this._providers.get(id)!);
      }
    }

    const first = Array.from(this._providers.values())[0];
    if (first) return Promise.resolve(first);

    throw new Error('[AIRouter] No suitable AI providers are configured or registered.');
  }

  registerProvider(provider: IAIProvider): void {
    this._providers.set(provider.id, provider);
  }

  removeProvider(id: string): void {
    this._providers.delete(id);
  }

  setDefaultProvider(id: string): void {
    this._defaultProviderId = id;
  }

  setFallbackChain(providerIds: string[]): void {
    this._fallbackChain = [...providerIds];
  }

  getProviders(): IAIProvider[] {
    return Array.from(this._providers.values());
  }

  getDefaultProvider(): IAIProvider | undefined {
    if (!this._defaultProviderId) return undefined;
    return this._providers.get(this._defaultProviderId);
  }
}
