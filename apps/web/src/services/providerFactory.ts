import { GeminiProvider } from '@unify/platform-ai';
import { GrokProvider } from '@unify/platform-ai';
import { GroqProvider } from '@unify/platform-ai';
import { HuggingFaceProvider } from '@unify/platform-ai';
import { MockAIProvider } from '@unify/platform-ai';
import type { IAIProvider } from '@unify/platform-ai';
import type { ProviderConfig } from '../stores/providerStore';

/**
 * providerFactory — Single source of truth for instantiating AI providers.
 * Converts any ProviderConfig into the correct IAIProvider instance.
 * Add new providers here and they automatically work everywhere.
 */
export function buildProvider(config: ProviderConfig): IAIProvider {
  if (!config.apiKey || config.apiKey === 'local') {
    return new MockAIProvider();
  }

  switch (config.id) {
    case 'gemini':
      return new GeminiProvider(config.apiKey);
    case 'grok':
      return new GrokProvider(config.apiKey);
    case 'groq':
      return new GroqProvider(config.apiKey);
    case 'huggingface':
    case 'hf':
      return new HuggingFaceProvider(config.apiKey);
    default:
      // Any unrecognized provider falls back gracefully
      return new MockAIProvider();
  }
}

/**
 * getActiveProvider — Reads the current active provider config and builds it.
 * Pass in the providers array from useProviderStore.
 */
export function getActiveProvider(providers: ProviderConfig[]): { provider: IAIProvider; config: ProviderConfig | null } {
  const activeConfig = providers.find(p => p.isActive) ?? providers[0] ?? null;
  if (!activeConfig) {
    return { provider: new MockAIProvider(), config: null };
  }
  return { provider: buildProvider(activeConfig), config: activeConfig };
}
