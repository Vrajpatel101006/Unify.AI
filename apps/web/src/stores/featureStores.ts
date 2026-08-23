import { create } from 'zustand';
import { generateId } from '@unify/shared';
import { useProviderStore } from './providerStore';

// ==========================================
// 1. Repository Intelligence Types
// ==========================================
export interface LanguageStat {
  language: string;
  percentage: number;
  color: string;
  filesCount: number;
}

export interface DependencyNode {
  id: string;
  label: string;
  type: 'project' | 'package' | 'file';
  dependsOn: string[];
}

export interface RepoIntelState {
  languages: LanguageStat[];
  dependencies: DependencyNode[];
  detectedFrameworks: string[];
  totalFiles: number;
  totalLines: number;
  architectureType: string;
  scanStatus: 'idle' | 'scanning' | 'completed';
  triggerScan: () => Promise<void>;
}

// ==========================================
// 2. Code Intelligence Types
// ==========================================
export interface DiagnosticItem {
  id: string;
  filePath: string;
  line: number;
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
  codeSnippet?: string;
  targetContent?: string;
  replacementContent?: string;
}

export interface TodoItem {
  id: string;
  filePath: string;
  line: number;
  text: string;
  completed: boolean;
}

export interface CodeIntelState {
  diagnostics: DiagnosticItem[];
  todos: TodoItem[];
  isAnalyzing: boolean;
  analysisError: string | null;
  // Folder mode
  analyzeMode: 'file' | 'folder';
  setAnalyzeMode: (mode: 'file' | 'folder') => void;
  folderProgress: { total: number; done: number };
  analyzeFile: (filePath: string) => Promise<void>;
  analyzeFolder: (filePaths: string[]) => Promise<void>;
  applyQuickFix: (diagnosticId: string, filePath: string) => Promise<void>;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  addTodo: (filePath: string, line: number, text: string) => void;
}

// ==========================================
// 3. Database Workspace Types
// ==========================================
export interface TableSchema {
  tableName: string;
  columns: { name: string; type: string; isPrimaryKey: boolean; isNullable: boolean }[];
  rowCount: number;
}

export interface SqlQueryLog {
  id: string;
  query: string;
  executedAt: number;
  status: 'success' | 'error';
  executionTimeMs: number;
  resultSummary: string;
}

export interface DatabaseState {
  tables: TableSchema[];
  queryLogs: SqlQueryLog[];
  executeQuery: (query: string) => Promise<SqlQueryLog>;
  clearQueryLogs: () => void;
}

// ==========================================
// 4. API Workspace Types
// ==========================================
export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  headers: { key: string; value: string }[];
  params: { key: string; value: string; required: boolean }[];
  mockResponse: string;
}

export interface ApiState {
  endpoints: ApiEndpoint[];
  envVariables: Record<string, string>;
  activeEnv: string;
  setEnvVariable: (key: string, value: string) => void;
  setActiveEnv: (env: string) => void;
  addEndpoint: (endpoint: Omit<ApiEndpoint, 'id'>) => void;
  deleteEndpoint: (id: string) => void;
  updateEndpoint: (id: string, updated: Partial<ApiEndpoint>) => void;
}

// ==========================================
// 5. Documentation Types
// ==========================================
export interface DocFile {
  id: string;
  title: string;
  type: 'readme' | 'api' | 'architecture' | 'changelog';
  content: string;
  updatedAt: number;
}

export interface DocState {
  docs: DocFile[];
  generateDoc: (type: DocFile['type'], context?: string) => Promise<void>;
  updateDocContent: (id: string, content: string) => void;
  loadDocFileContent: (title: string, content: string) => void;
}

// ==========================================
// Consolidated Feature Store Interface
// ==========================================
interface FeatureStore {
  repoIntel: RepoIntelState;
  codeIntel: CodeIntelState;
  database: DatabaseState;
  api: ApiState;
  doc: DocState;
}

export const useFeatureStore = create<FeatureStore>((set, get) => ({
  // 1. Repository Intelligence State
  repoIntel: {
    languages: [],
    dependencies: [],
    detectedFrameworks: [],
    totalFiles: 0,
    totalLines: 0,
    architectureType: 'Unknown — run a scan to detect',
    scanStatus: 'idle',
    triggerScan: async () => {
      set((state) => ({ repoIntel: { ...state.repoIntel, scanStatus: 'scanning' } }));
      await new Promise((r) => setTimeout(r, 1500));
      set((state) => ({
        repoIntel: {
          ...state.repoIntel,
          scanStatus: 'completed',
        },
      }));
    },
  },

  // 2. Code Intelligence State
    codeIntel: {
    diagnostics: [],
    todos: [],
    isAnalyzing: false,
    analysisError: null,
    analyzeMode: 'file' as 'file' | 'folder',
    folderProgress: { total: 0, done: 0 },
    setAnalyzeMode: (mode) => set((state) => ({ codeIntel: { ...state.codeIntel, analyzeMode: mode } })),
    analyzeFile: async (filePath) => {
      set((state) => ({ codeIntel: { ...state.codeIntel, isAnalyzing: true, analysisError: null } }));
      try {
        const providers = useProviderStore.getState().providers;
        const provider = providers.find((p: any) => p.isActive) || providers[0];

        if (!provider || !provider.apiKey) {
          throw new Error('No AI Provider API key configured. Please set one up first.');
        }

        const res = await fetch('/api/local/code/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: filePath,
            providerId: provider.id,
            apiKey: provider.apiKey
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to analyze code');
        }

        const newDiags = (data.diagnostics || []).map((d: any) => ({
          ...d,
          id: generateId(),
          filePath: filePath
        }));

        set((state) => ({
          codeIntel: {
            ...state.codeIntel,
            isAnalyzing: false,
            diagnostics: newDiags,
          },
        }));
      } catch (err: any) {
        set((state) => ({
          codeIntel: {
            ...state.codeIntel,
            isAnalyzing: false,
            analysisError: err.message
          }
        }));
      }
    },
    analyzeFolder: async (filePaths) => {
      set((state) => ({
        codeIntel: {
          ...state.codeIntel,
          isAnalyzing: true,
          analysisError: null,
          diagnostics: [],
          folderProgress: { total: filePaths.length, done: 0 }
        }
      }));

      const providers = useProviderStore.getState().providers;
      const provider = providers.find((p: any) => p.isActive) || providers[0];

      if (!provider || !provider.apiKey) {
        set((state) => ({
          codeIntel: { ...state.codeIntel, isAnalyzing: false, analysisError: 'No AI Provider API key configured.' }
        }));
        return;
      }

      const allDiagnostics: any[] = [];
      for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i];
        try {
          const res = await fetch('/api/local/code/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: filePath, providerId: provider.id, apiKey: provider.apiKey })
          });
          const data = await res.json();
          if (res.ok && data.diagnostics) {
            const mapped = data.diagnostics.map((d: any) => ({ ...d, id: generateId(), filePath }));
            allDiagnostics.push(...mapped);
          }
        } catch { /* skip failed files */ }
        set((state) => ({
          codeIntel: { ...state.codeIntel, folderProgress: { total: filePaths.length, done: i + 1 } }
        }));
      }

      set((state) => ({
        codeIntel: { ...state.codeIntel, isAnalyzing: false, diagnostics: allDiagnostics }
      }));
    },
    applyQuickFix: async (diagnosticId, filePath) => {
      const diag = get().codeIntel.diagnostics.find((d: any) => d.id === diagnosticId);
      if (!diag || !diag.targetContent || !diag.replacementContent) return;

      const res = await fetch('/api/local/code/apply-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          targetContent: diag.targetContent,
          replacementContent: diag.replacementContent
        })
      });

      if (!res.ok) {
        const err = await res.json();
        alert('Failed to apply quick fix: ' + (err.error || 'Unknown error'));
        return;
      }

      alert('Quick fix applied successfully!');
      // Re-run analysis automatically
      get().codeIntel.analyzeFile(filePath);
    },
    toggleTodo: (id) => set((state) => ({
      codeIntel: {
        ...state.codeIntel,
        todos: state.codeIntel.todos.map((todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ),
      },
    })),
    removeTodo: (id) => set((state) => ({
      codeIntel: {
        ...state.codeIntel,
        todos: state.codeIntel.todos.filter((todo) => todo.id !== id),
      },
    })),
    addTodo: (filePath, line, text) => set((state) => ({
      codeIntel: {
        ...state.codeIntel,
        todos: [...state.codeIntel.todos, { id: generateId(), filePath, line, text, completed: false }],
      },
    })),
  },

  // 3. Database State
  database: {
    tables: [],
    queryLogs: [],
    executeQuery: async (query) => {
      const providers = useProviderStore.getState().providers;
      const activeProvider = providers.find((p: any) => p.isActive) || providers[0];
      const isSelect = query.trim().toUpperCase().startsWith('SELECT');

      let resultSummary = '';
      let status: 'success' | 'error' = 'success';
      const startTime = Date.now();

      if (activeProvider?.apiKey && activeProvider.apiKey !== 'local') {
        try {
          const prompt = `You are a professional SQL database query planner and runner simulator. Execute the following query:
"${query}"

Simulate what a real SQL database would return. If the query has syntax errors, return a clear SQL error message.
Otherwise, return a neat text representation of the result set (e.g. 3-4 rows of data in a clean ASCII table structure, or a success summary like "INSERT 0 1").
Do not wrap your output in markdown code blocks (\`\`\`), do not write introductory text, do not write explanations. Return ONLY the direct database console output representation.`;

          let apiUrl = '', model = '', authHeader = '';
          if (activeProvider.id === 'groq') {
            apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
            model = 'openai/gpt-oss-120b';
            authHeader = `Bearer ${activeProvider.apiKey}`;
          } else if (activeProvider.id === 'grok') {
            apiUrl = 'https://api.x.ai/v1/chat/completions';
            model = 'grok-beta';
            authHeader = `Bearer ${activeProvider.apiKey}`;
          } else if (activeProvider.id === 'huggingface' || activeProvider.id === 'hf') {
            apiUrl = 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.3-70B-Instruct/v1/chat/completions';
            model = 'meta-llama/Llama-3.3-70B-Instruct';
            authHeader = `Bearer ${activeProvider.apiKey}`;
          }

          if (apiUrl) {
            const res = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
              body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 500, temperature: 0.1 })
            });
            if (res.ok) {
              const data = await res.json() as any;
              resultSummary = data.choices?.[0]?.message?.content?.trim() || '';
            } else {
              status = 'error';
              resultSummary = `Database connection failed. AI Provider API returned status: ${res.status}`;
            }
          } else if (activeProvider.id === 'gemini') {
            // Direct Gemini call
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${activeProvider.apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
              })
            });
            if (geminiRes.ok) {
              const gData = await geminiRes.json() as any;
              resultSummary = gData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            } else {
              status = 'error';
              resultSummary = `Database connection failed. Gemini API returned status: ${geminiRes.status}`;
            }
          }
        } catch (err: any) {
          status = 'error';
          resultSummary = `Database connection error: ${err.message}`;
        }
      }

      if (!resultSummary) {
        // Local baseline fallback if no API key is provided
        status = query.toUpperCase().includes('ERROR') ? 'error' : 'success';
        resultSummary = query.toUpperCase().includes('ERROR')
          ? 'Error code 42P01: relation table does not exist.'
          : isSelect
          ? 'id | email | display_name | created_at\n----+-------+--------------+-----------\n(0 rows)'
          : 'Query executed successfully. Affected 0 rows.';
      }

      const logEntry: SqlQueryLog = {
        id: generateId(),
        query,
        executedAt: Date.now(),
        status,
        executionTimeMs: Date.now() - startTime || 5,
        resultSummary,
      };

      set((state) => ({
        database: {
          ...state.database,
          queryLogs: [logEntry, ...state.database.queryLogs],
        },
      }));

      return logEntry;
    },
    clearQueryLogs: () => set((state) => ({
      database: { ...state.database, queryLogs: [] },
    })),
  },

  // 4. API State
  api: {
    endpoints: [],
    envVariables: {
      baseUrl: 'http://localhost:5000',
      token: '',
    },
    activeEnv: 'Development',
    setEnvVariable: (key, value) => set((state) => ({
      api: {
        ...state.api,
        envVariables: { ...state.api.envVariables, [key]: value },
      },
    })),
    setActiveEnv: (env) => set((state) => ({
      api: { ...state.api, activeEnv: env },
    })),
    addEndpoint: (endpoint) => set((state) => ({
      api: {
        ...state.api,
        endpoints: [...state.api.endpoints, { ...endpoint, id: generateId() }],
      },
    })),
    deleteEndpoint: (id) => set((state) => ({
      api: {
        ...state.api,
        endpoints: state.api.endpoints.filter((ep) => ep.id !== id),
      },
    })),
    updateEndpoint: (id, updated) => set((state) => ({
      api: {
        ...state.api,
        endpoints: state.api.endpoints.map((ep) =>
          ep.id === id ? { ...ep, ...updated } : ep
        ),
      },
    })),
  },

  // 5. Documentation State
  doc: {
    docs: [],
    generateDoc: async (type, context) => {
      // Show loading state
      set((state) => ({ doc: { ...state.doc, docs: state.doc.docs.map(d => d.type === type ? { ...d, content: '⏳ Generating documentation with AI...' } : d) } }));

      const providers = useProviderStore.getState().providers;
      const activeProvider = providers.find((p: any) => p.isActive) || providers[0];

      const title = type === 'readme' ? 'README.md' : type === 'api' ? 'API_DOCS.md' : type === 'architecture' ? 'ARCHITECTURE.md' : 'CHANGELOG.md';

      let content = `# ${title}\n\n*AI generation failed. Please check your provider configuration.*`;

      if (activeProvider?.apiKey) {
        try {
          const prompt = `You are a technical documentation writer. Generate a professional, well-structured ${title} markdown document for a software project. Context: ${context || 'Unify.AI - a developer productivity suite with AI-powered features built with React, TypeScript, and a monorepo architecture.'}. Make it detailed, professional, and immediately useful. Use proper markdown with headings, code blocks, and tables where appropriate.`;

          let apiUrl = '', model = '', authHeader = '';
          if (activeProvider.id === 'groq') {
            apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
            model = 'openai/gpt-oss-120b';
            authHeader = `Bearer ${activeProvider.apiKey}`;
          } else if (activeProvider.id === 'grok') {
            apiUrl = 'https://api.x.ai/v1/chat/completions';
            model = 'grok-beta';
            authHeader = `Bearer ${activeProvider.apiKey}`;
          } else if (activeProvider.id === 'huggingface' || activeProvider.id === 'hf') {
            apiUrl = 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.3-70B-Instruct/v1/chat/completions';
            model = 'meta-llama/Llama-3.3-70B-Instruct';
            authHeader = `Bearer ${activeProvider.apiKey}`;
          }

          if (apiUrl) {
            const res = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
              body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 1500 })
            });
            if (res.ok) {
              const data = await res.json() as any;
              content = data.choices?.[0]?.message?.content || content;
            }
          }
        } catch { /* use fallback content */ }
      }

      set((state) => {
        const exists = state.doc.docs.some((d) => d.type === type);
        if (exists) {
          return { doc: { ...state.doc, docs: state.doc.docs.map((d) => d.type === type ? { ...d, content, updatedAt: Date.now() } : d) } };
        }
        return { doc: { ...state.doc, docs: [...state.doc.docs, { id: generateId(), title, type, content, updatedAt: Date.now() }] } };
      });
    },
    updateDocContent: (id, content) => set((state) => ({
      doc: {
        ...state.doc,
        docs: state.doc.docs.map((d) =>
          d.id === id ? { ...d, content, updatedAt: Date.now() } : d
        ),
      },
    })),
    loadDocFileContent: (title: string, content: string) => set((state) => ({
      doc: {
        ...state.doc,
        docs: [
          ...state.doc.docs.filter(d => d.title !== title),
          { id: generateId(), title, type: 'readme' as const, content, updatedAt: Date.now() }
        ]
      }
    })),
  },
}));
