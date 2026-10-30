import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ProviderConfig {
  id: string; // e.g. 'openai', 'gemini', 'claude', 'deepseek', 'ollama'
  name: string;
  configured: boolean;
  baseUrl?: string;
  isActive: boolean;
  latency?: number; // ms
  models: string[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    costEstimate: number;
  };
}

interface ProviderStore {
  providers: ProviderConfig[];
  addOrUpdateProvider: (config: Omit<ProviderConfig, 'usage' | 'isActive'> & { apiKey?: string }) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  setDefaultProvider: (id: string) => void;
  testLatency: (id: string) => Promise<number>;
  addUsage: (id: string, promptTokens: number, completionTokens: number, cost: number) => void;
  clearUsage: (id: string) => void;
}

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    configured: false,
    isActive: true,
    models: ['gemini-3.1-pro-preview', 'gemini-2.5-flash', 'gemini-1.5-flash'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    configured: false,
    isActive: false,
    models: ['Qwen/Qwen2.5-Coder-32B-Instruct', 'meta-llama/Meta-Llama-3.1-70B-Instruct'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    configured: false,
    isActive: false,
    models: ['grok-beta', 'grok-vision-beta', 'grok-2'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
  {
    id: 'groq',
    name: 'Groq',
    configured: false,
    isActive: false,
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
  {
    id: 'openai',
    name: 'OpenAI',
    configured: false,
    isActive: false,
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-mini'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    configured: false,
    isActive: false,
    models: ['claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    configured: false,
    isActive: false,
    models: ['deepseek-chat', 'deepseek-coder'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    configured: true, // Always considered configured since it's local
    baseUrl: 'http://localhost:11434',
    isActive: false,
    models: ['llama3', 'mistral', 'codegemma', 'qwen2.5-coder'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
];

export const useProviderStore = create<ProviderStore>()(
  persist(
    (set, get) => ({
      providers: DEFAULT_PROVIDERS,

      addOrUpdateProvider: async (config) => {
        if (config.apiKey && config.id !== 'ollama') {
          try {
            await fetch('/api/providers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ providerId: config.id, apiKey: config.apiKey }),
              credentials: 'include'
            });
          } catch (e) {
            console.error('Failed to save API key:', e);
          }
        }

        set((state) => {
          const exists = state.providers.some((p) => p.id === config.id);
          const configured = !!config.apiKey || config.configured;
          
          if (exists) {
            return {
              providers: state.providers.map((p) =>
                p.id === config.id ? { ...p, ...config, configured } : p
              ),
            };
          }
          return {
            providers: [
              ...state.providers,
              {
                ...config,
                configured,
                isActive: false,
                usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
              },
            ],
          };
        });
      },

      removeProvider: async (id) => {
        try {
          if (id !== 'ollama') {
            await fetch(`/api/providers/${id}`, { method: 'DELETE', credentials: 'include' });
          }
        } catch (e) {
          console.error('Failed to remove API key:', e);
        }
        
        set((state) => ({
          providers: state.providers.map((p) => p.id === id ? { ...p, configured: false } : p),
        }));
      },

      setDefaultProvider: (id) => set((state) => ({
        providers: state.providers.map((p) => ({
          ...p,
          isActive: p.id === id,
        })),
      })),

      testLatency: async (id) => {
        const provider = get().providers.find((p: ProviderConfig) => p.id === id);
        if (!provider || !provider.configured) {
          return 0;
        }

        const startTime = Date.now();
        try {
          let url = '/api/providers';
          if (id === 'ollama') {
            url = provider.baseUrl ? `${provider.baseUrl}/api/tags` : 'http://localhost:11434/api/tags';
          }
          
          const res = await fetch(url, { method: 'GET', credentials: 'include' });
          if (!res.ok) throw new Error(`Status ${res.status}`);
          const latency = Date.now() - startTime;
          set((state) => ({
            providers: state.providers.map((p) =>
              p.id === id ? { ...p, latency } : p
            ),
          }));
          return latency;
        } catch (err) {
          console.error(`[providerStore] Latency ping failed for ${id}:`, err);
          // Return -1 to represent connection error or invalid API key
          set((state) => ({
            providers: state.providers.map((p) =>
              p.id === id ? { ...p, latency: -1 } : p
            ),
          }));
          return -1;
        }
      },

      addUsage: (id, promptTokens, completionTokens, cost) => set((state) => ({
        providers: state.providers.map((p) =>
          p.id === id
            ? {
                ...p,
                usage: {
                  promptTokens: p.usage.promptTokens + promptTokens,
                  completionTokens: p.usage.completionTokens + completionTokens,
                  costEstimate: p.usage.costEstimate + cost,
                },
              }
            : p
        ),
      })),

      clearUsage: (id) => set((state) => ({
        providers: state.providers.map((p) =>
          p.id === id
            ? {
                ...p,
                usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
              }
            : p
        ),
      })),
    }),
    {
      name: 'provider-storage',
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState: any, currentState: ProviderStore) => {
        const persistedProviders = persistedState.providers || [];
        const persistedMap = new Map(persistedProviders.map((p: any) => [p.id, p]));
        
        // Merge defaults with persisted overrides
        const mergedProviders = currentState.providers.map(defaultProvider => {
          if (persistedMap.has(defaultProvider.id)) {
            // Never re-hydrate an apiKey if it was somehow persisted previously
            const { apiKey, ...rest } = persistedMap.get(defaultProvider.id) as any;
            return { ...defaultProvider, ...rest };
          }
          return defaultProvider;
        });

        // Retain any custom providers the user added themselves
        const defaultMap = new Map(currentState.providers.map(p => [p.id, p]));
        for (const p of persistedProviders) {
          if (!defaultMap.has(p.id)) {
            const { apiKey, ...rest } = p;
            mergedProviders.push(rest);
          }
        }

        return {
          ...currentState,
          ...persistedState,
          providers: mergedProviders
        };
      }
    }
  )
);
export type { ProviderStore };
