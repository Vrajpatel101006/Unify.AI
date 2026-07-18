import { create } from 'zustand';
import { generateId } from '@unify/shared';

export interface PromptVersion {
  version: string;
  template: string;
  updatedAt: number;
  author: string;
}

export interface PromptItem {
  id: string;
  folderId: string | null;
  name: string;
  description: string;
  category: string; // 'sql' | 'api' | 'code' | 'general'
  systemPrompt?: string;
  userPromptTemplate: string;
  variables: string[]; // parsed templates
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  version: string;
  history: PromptVersion[];
}

export interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
}

interface PromptStore {
  prompts: PromptItem[];
  folders: FolderNode[];
  selectedPromptId: string | null;
  selectedFolderId: string | null;

  addFolder: (name: string, parentId?: string | null) => void;
  removeFolder: (id: string) => void;
  addPrompt: (prompt: Omit<PromptItem, 'id' | 'isFavorite' | 'isPinned' | 'version' | 'history'>) => void;
  updatePrompt: (id: string, updates: Partial<PromptItem>) => void;
  deletePrompt: (id: string) => void;
  toggleFavorite: (id: string) => void;
  togglePin: (id: string) => void;
  selectPrompt: (id: string | null) => void;
  selectFolder: (id: string | null) => void;
  createNewVersion: (id: string, template: string) => void;
  importPrompts: (promptsJson: string) => void;
  exportPrompts: () => string;
}

const DEFAULT_FOLDERS: FolderNode[] = [
  { id: 'f-sql', name: 'Database Queries', parentId: null },
  { id: 'f-api', name: 'API Templates', parentId: null },
  { id: 'f-code', name: 'Refactoring Guides', parentId: null },
];

const DEFAULT_PROMPTS: PromptItem[] = [
  {
    id: 'p-sql-explain',
    folderId: 'f-sql',
    name: 'Explain Query Plan',
    description: 'Summarize index utilization and explain execution costs',
    category: 'sql',
    userPromptTemplate: 'Explain and optimize this SQL query for PostgreSQL:\n\n```sql\n{{query}}\n```\n\nActive table indexes: {{indexes}}',
    variables: ['query', 'indexes'],
    tags: ['postgres', 'optimization'],
    isFavorite: true,
    isPinned: true,
    version: '1.0.0',
    history: [
      { version: '1.0.0', template: 'Explain and optimize this SQL query for PostgreSQL:\n\n```sql\n{{query}}\n```\n\nActive table indexes: {{indexes}}', updatedAt: Date.now(), author: 'Vraj Patel' }
    ]
  },
  {
    id: 'p-api-mock',
    folderId: 'f-api',
    name: 'Generate JSON Mock Responses',
    description: 'Creates test data mocks matching standard model schemas',
    category: 'api',
    userPromptTemplate: 'Generate a JSON mock array of {{count}} items matching this C# model schema:\n\n{{schema}}',
    variables: ['count', 'schema'],
    tags: ['mock', 'testing'],
    isFavorite: false,
    isPinned: false,
    version: '1.0.0',
    history: [
      { version: '1.0.0', template: 'Generate a JSON mock array of {{count}} items matching this C# model schema:\n\n{{schema}}', updatedAt: Date.now(), author: 'Vraj Patel' }
    ]
  },
  {
    id: 'p-code-clean',
    folderId: 'f-code',
    name: 'Clean Code refactor',
    description: 'Check unused imports, cognitive complexity, and readability rules',
    category: 'code',
    userPromptTemplate: 'Refactor this {{language}} code to satisfy SOLID principles and reduce nesting complexity:\n\n```{{language}}\n{{code}}\n```',
    variables: ['language', 'code'],
    tags: ['refactor', 'solid'],
    isFavorite: true,
    isPinned: false,
    version: '1.0.0',
    history: [
      { version: '1.0.0', template: 'Refactor this {{language}} code to satisfy SOLID principles and reduce nesting complexity:\n\n```{{language}}\n{{code}}\n```', updatedAt: Date.now(), author: 'Vraj Patel' }
    ]
  }
];

export const usePromptStore = create<PromptStore>((set, get) => ({
  prompts: DEFAULT_PROMPTS,
  folders: DEFAULT_FOLDERS,
  selectedPromptId: DEFAULT_PROMPTS[0]?.id || null,
  selectedFolderId: null,

  addFolder: (name, parentId = null) => set((state) => ({
    folders: [...state.folders, { id: generateId(), name, parentId }],
  })),

  removeFolder: (id) => set((state) => ({
    folders: state.folders.filter((f) => f.id !== id),
    // Reparent prompts in deleted folder to root
    prompts: state.prompts.map((p) =>
      p.folderId === id ? { ...p, folderId: null } : p
    ),
  })),

  addPrompt: (prompt) => set((state) => {
    const id = generateId();
    const newPrompt: PromptItem = {
      ...prompt,
      id,
      isFavorite: false,
      isPinned: false,
      version: '1.0.0',
      history: [
        { version: '1.0.0', template: prompt.userPromptTemplate, updatedAt: Date.now(), author: 'Vraj Patel' }
      ]
    };
    return {
      prompts: [...state.prompts, newPrompt],
      selectedPromptId: id,
    };
  }),

  updatePrompt: (id, updates) => set((state) => ({
    prompts: state.prompts.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    ),
  })),

  deletePrompt: (id) => set((state) => {
    const nextPrompts = state.prompts.filter((p) => p.id !== id);
    let nextSelectedId = state.selectedPromptId;
    if (nextSelectedId === id) {
      nextSelectedId = nextPrompts[0]?.id || null;
    }
    return {
      prompts: nextPrompts,
      selectedPromptId: nextSelectedId,
    };
  }),

  toggleFavorite: (id) => set((state) => ({
    prompts: state.prompts.map((p) =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    ),
  })),

  togglePin: (id) => set((state) => ({
    prompts: state.prompts.map((p) =>
      p.id === id ? { ...p, isPinned: !p.isPinned } : p
    ),
  })),

  selectPrompt: (id) => set(() => ({ selectedPromptId: id })),

  selectFolder: (id) => set(() => ({ selectedFolderId: id })),

  createNewVersion: (id, template) => set((state) => {
    return {
      prompts: state.prompts.map((p) => {
        if (p.id === id) {
          const nextVerMajor = parseInt(p.version.split('.')[0] || '1', 10) + 1;
          const newVersion = `${nextVerMajor}.0.0`;
          const historyEntry: PromptVersion = {
            version: newVersion,
            template,
            updatedAt: Date.now(),
            author: 'Vraj Patel',
          };
          return {
            ...p,
            userPromptTemplate: template,
            version: newVersion,
            history: [...p.history, historyEntry],
          };
        }
        return p;
      }),
    };
  }),

  importPrompts: (promptsJson) => {
    try {
      const parsed = JSON.parse(promptsJson) as PromptItem[];
      set((state) => ({
        prompts: [...state.prompts, ...parsed.map(p => ({ ...p, id: generateId() }))],
      }));
    } catch (err) {
      console.error('[PromptStore] Failed to import prompts:', err);
    }
  },

  exportPrompts: () => {
    return JSON.stringify(get().prompts, null, 2);
  },
}));
export type { PromptStore };
