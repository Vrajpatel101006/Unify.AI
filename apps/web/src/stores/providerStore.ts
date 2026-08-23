import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Encrypted localStorage Storage ─────────────────────────────────────────
// Lightweight XOR cipher to obfuscate sensitive API keys in localStorage.
// This prevents trivial exposure via DevTools, XSS, or third-party scripts.
const STORAGE_KEY_SEED = 'unify_prov_v1';

function xorCipher(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function encodeSecure(data: string): string {
  try {
    return btoa(xorCipher(data, STORAGE_KEY_SEED));
  } catch {
    return data;
  }
}

function decodeSecure(encoded: string): string {
  try {
    return xorCipher(atob(encoded), STORAGE_KEY_SEED);
  } catch {
    return encoded;
  }
}

const encryptedStorage = createJSONStorage<ProviderStore>(() => ({
  getItem: (key: string) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return decodeSecure(raw);
    } catch {
      return raw;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, encodeSecure(value));
    } catch {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
  },
}));

export interface ProviderConfig {
  id: string; // e.g. 'openai', 'gemini', 'claude', 'deepseek', 'ollama'
  name: string;
  apiKey: string;
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
  addOrUpdateProvider: (config: Omit<ProviderConfig, 'usage' | 'isActive'>) => void;
  removeProvider: (id: string) => void;
  setDefaultProvider: (id: string) => void;
  testLatency: (id: string) => Promise<number>;
  addUsage: (id: string, promptTokens: number, completionTokens: number, cost: number) => void;
  clearUsage: (id: string) => void;
}

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    apiKey: '',
    isActive: true,
    models: ['gemini-3.1-pro-preview', 'gemini-2.5-flash', 'gemini-1.5-flash'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    apiKey: '',
    isActive: false,
    models: ['Qwen/Qwen2.5-Coder-32B-Instruct', 'meta-llama/Meta-Llama-3.1-70B-Instruct'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    apiKey: '',
    isActive: false,
    models: ['grok-beta', 'grok-vision-beta', 'grok-2'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
  {
    id: 'groq',
    name: 'Groq',
    apiKey: '',
    isActive: false,
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
  {
    id: 'openai',
    name: 'OpenAI',
    apiKey: '',
    isActive: false,
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-mini'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    apiKey: '',
    isActive: false,
    models: ['claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    apiKey: '',
    isActive: false,
    models: ['deepseek-chat', 'deepseek-coder'],
    usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    apiKey: 'local',
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

      addOrUpdateProvider: (config) => set((state) => {
        const exists = state.providers.some((p) => p.id === config.id);
        if (exists) {
          return {
            providers: state.providers.map((p) =>
              p.id === config.id ? { ...p, ...config } : p
            ),
          };
        }
        return {
          providers: [
            ...state.providers,
            {
              ...config,
              isActive: false,
              usage: { promptTokens: 0, completionTokens: 0, costEstimate: 0 },
            },
          ],
        };
      }),

      removeProvider: (id) => set((state) => ({
        providers: state.providers.filter((p) => p.id !== id),
      })),

      setDefaultProvider: (id) => set((state) => ({
        providers: state.providers.map((p) => ({
          ...p,
          isActive: p.id === id,
        })),
      })),

      testLatency: async (id) => {
        const provider = get().providers.find((p: ProviderConfig) => p.id === id);
        if (!provider || !provider.apiKey || provider.apiKey === 'local') {
          return 0;
        }

        const startTime = Date.now();
        let url = '';
        let headers: Record<string, string> = {};

        switch (id) {
          case 'gemini':
            url = `https://generativelanguage.googleapis.com/v1beta/models?key=${provider.apiKey}`;
            break;
          case 'groq':
            url = 'https://api.groq.com/openai/v1/models';
            headers = { 'Authorization': `Bearer ${provider.apiKey}` };
            break;
          case 'grok':
            url = 'https://api.x.ai/v1/models';
            headers = { 'Authorization': `Bearer ${provider.apiKey}` };
            break;
          case 'huggingface':
          case 'hf':
            url = 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.3-70B-Instruct';
            headers = { 'Authorization': `Bearer ${provider.apiKey}` };
            break;
          case 'openai':
            url = 'https://api.openai.com/v1/models';
            headers = { 'Authorization': `Bearer ${provider.apiKey}` };
            break;
          case 'claude':
            url = 'https://api.anthropic.com/v1/models';
            headers = {
              'x-api-key': provider.apiKey,
              'anthropic-version': '2023-06-01'
            };
            break;
          case 'deepseek':
            url = 'https://api.deepseek.com/models';
            headers = { 'Authorization': `Bearer ${provider.apiKey}` };
            break;
          case 'ollama':
            url = provider.baseUrl ? `${provider.baseUrl}/api/tags` : 'http://localhost:11434/api/tags';
            break;
          default:
            return 0;
        }

        try {
          const res = await fetch(url, { method: 'GET', headers });
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
      storage: encryptedStorage,
      merge: (persistedState: any, currentState: ProviderStore) => {
        const persistedProviders = persistedState.providers || [];
        const persistedMap = new Map(persistedProviders.map((p: any) => [p.id, p]));
        
        // Merge defaults with persisted overrides (like API keys and active status)
        const mergedProviders = currentState.providers.map(defaultProvider => {
          if (persistedMap.has(defaultProvider.id)) {
            return { ...defaultProvider, ...(persistedMap.get(defaultProvider.id) as any) };
          }
          return defaultProvider;
        });

        // Retain any custom providers the user added themselves
        const defaultMap = new Map(currentState.providers.map(p => [p.id, p]));
        for (const p of persistedProviders) {
          if (!defaultMap.has(p.id)) {
            mergedProviders.push(p);
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
