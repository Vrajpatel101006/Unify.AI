import { create } from 'zustand';

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
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'],
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

export const useProviderStore = create<ProviderStore>((set) => ({
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
    // Simulate API connection speed test
    await new Promise((r) => setTimeout(r, 600));
    const randomLatency = Math.floor(100 + Math.random() * 400);

    set((state) => ({
      providers: state.providers.map((p) =>
        p.id === id ? { ...p, latency: randomLatency } : p
      ),
    }));

    return randomLatency;
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
}));
export type { ProviderStore };
