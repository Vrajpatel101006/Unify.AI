import { create } from 'zustand';
import { generateId } from '@unify/shared';

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
  type: 'unused-import' | 'duplicate-code' | 'dead-code' | 'complexity';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
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
  selectedFileAnalysis: {
    complexityScore: number;
    linesOfCode: number;
    functionsCount: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  } | null;
  analyzeFile: (filePath: string) => void;
  toggleTodo: (id: string) => void;
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
  executeQuery: (query: string) => SqlQueryLog;
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
  generateDoc: (type: DocFile['type'], context?: string) => void;
  updateDocContent: (id: string, content: string) => void;
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

export const useFeatureStore = create<FeatureStore>((set) => ({
  // 1. Repository Intelligence State
  repoIntel: {
    languages: [
      { language: 'TypeScript', percentage: 48, color: '#3178c6', filesCount: 64 },
      { language: 'C# (ASP.NET Core)', percentage: 32, color: '#178600', filesCount: 42 },
      { language: 'CSS/HTML', percentage: 12, color: '#563d7c', filesCount: 15 },
      { language: 'JavaScript', percentage: 8, color: '#f1e05a', filesCount: 10 },
    ],
    dependencies: [
      { id: 'apps/web', label: 'apps/web (React)', type: 'project', dependsOn: ['packages/kernel', 'packages/shared'] },
      { id: 'apps/api', label: 'apps/api (ASP.NET)', type: 'project', dependsOn: ['packages/shared'] },
      { id: 'packages/kernel', label: 'packages/kernel', type: 'package', dependsOn: ['packages/shared'] },
      { id: 'packages/shared', label: 'packages/shared', type: 'package', dependsOn: [] },
    ],
    detectedFrameworks: ['React', 'Vite', 'Tailwind CSS v4', 'ASP.NET Core', 'Zustand', 'Entity Framework Core'],
    totalFiles: 131,
    totalLines: 15430,
    architectureType: 'Monorepo (Clean Architecture & Modular Plugins)',
    scanStatus: 'completed',
    triggerScan: async () => {
      set((state) => ({ repoIntel: { ...state.repoIntel, scanStatus: 'scanning' } }));
      await new Promise((r) => setTimeout(r, 1500));
      set((state) => ({
        repoIntel: {
          ...state.repoIntel,
          scanStatus: 'completed',
          totalFiles: state.repoIntel.totalFiles + 3,
          totalLines: state.repoIntel.totalLines + 450,
        },
      }));
    },
  },

  // 2. Code Intelligence State
  codeIntel: {
    diagnostics: [
      {
        id: 'd-1',
        filePath: 'apps/web/src/layouts/AppShell.tsx',
        line: 12,
        type: 'unused-import',
        severity: 'info',
        message: 'Unused import matching React hooks.',
        suggestion: 'Remove import { useEffect } from "react";'
      },
      {
        id: 'd-2',
        filePath: 'packages/platform/storage/src/WorkspaceDatabase.ts',
        line: 45,
        type: 'complexity',
        severity: 'warning',
        message: 'Cognitive complexity is high (14). Nested loops detected in transaction runner.',
        suggestion: 'Refactor transactions handler to split logic into utility subfunctions.'
      },
      {
        id: 'd-3',
        filePath: 'apps/web/src/App.tsx',
        line: 220,
        type: 'dead-code',
        severity: 'warning',
        message: 'Unused layout switcher logic route helper function.',
        suggestion: 'Safe to delete redundant legacy render routes helper.'
      }
    ],
    todos: [
      { id: 't-1', filePath: 'packages/kernel/src/WorkspaceLifecycle.ts', line: 15, text: 'TODO: Add secure transaction verification before shutdown.', completed: false },
      { id: 't-2', filePath: 'apps/api/Controllers/HealthController.cs', line: 8, text: 'TODO: Connect live db migration checker status pipeline checks.', completed: true },
      { id: 't-3', filePath: 'packages/platform/ai/src/AIRouter.ts', line: 52, text: 'TODO: Configure Ollama fallback timeout models.', completed: false },
    ],
    selectedFileAnalysis: null,
    analyzeFile: (_filePath) => set((state) => {
      // Simulate code intelligence metrics analyzer
      const score = Math.floor(60 + Math.random() * 38);
      const grade = score > 90 ? 'A' : score > 80 ? 'B' : score > 70 ? 'C' : score > 60 ? 'D' : 'F';
      return {
        codeIntel: {
          ...state.codeIntel,
          selectedFileAnalysis: {
            complexityScore: score,
            linesOfCode: Math.floor(100 + Math.random() * 400),
            functionsCount: Math.floor(4 + Math.random() * 12),
            grade,
          },
        },
      };
    }),
    toggleTodo: (id) => set((state) => ({
      codeIntel: {
        ...state.codeIntel,
        todos: state.codeIntel.todos.map((todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ),
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
    tables: [
      {
        tableName: 'users',
        rowCount: 1250,
        columns: [
          { name: 'id', type: 'UUID', isPrimaryKey: true, isNullable: false },
          { name: 'email', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false },
          { name: 'display_name', type: 'VARCHAR(100)', isPrimaryKey: false, isNullable: true },
          { name: 'created_at', type: 'TIMESTAMP', isPrimaryKey: false, isNullable: false },
        ],
      },
      {
        tableName: 'workspace_settings',
        rowCount: 4,
        columns: [
          { name: 'key', type: 'VARCHAR(100)', isPrimaryKey: true, isNullable: false },
          { name: 'value', type: 'TEXT', isPrimaryKey: false, isNullable: false },
          { name: 'updated_at', type: 'TIMESTAMP', isPrimaryKey: false, isNullable: false },
        ],
      },
      {
        tableName: 'prompt_history',
        rowCount: 320,
        columns: [
          { name: 'id', type: 'UUID', isPrimaryKey: true, isNullable: false },
          { name: 'template_id', type: 'VARCHAR(100)', isPrimaryKey: false, isNullable: false },
          { name: 'compiled_content', type: 'TEXT', isPrimaryKey: false, isNullable: false },
          { name: 'tokens_used', type: 'INT', isPrimaryKey: false, isNullable: false },
        ],
      },
    ],
    queryLogs: [
      { id: 'q-1', query: 'SELECT * FROM users WHERE email LIKE "%@google.com";', executedAt: Date.now() - 60000, status: 'success', executionTimeMs: 14, resultSummary: 'Returned 4 rows' },
      { id: 'q-2', query: 'INSERT INTO workspace_settings (key, value) VALUES ("ai.model", "gemini-pro");', executedAt: Date.now() - 120000, status: 'success', executionTimeMs: 4, resultSummary: 'Inserted 1 row' },
    ],
    executeQuery: (query) => {
      const isSelect = query.trim().toUpperCase().startsWith('SELECT');
      const logEntry: SqlQueryLog = {
        id: generateId(),
        query,
        executedAt: Date.now(),
        status: query.includes('ERROR') ? 'error' : 'success',
        executionTimeMs: Math.floor(3 + Math.random() * 20),
        resultSummary: query.includes('ERROR')
          ? 'Error code 42P01: relation table does not exist.'
          : isSelect
          ? `Returned ${Math.floor(1 + Math.random() * 50)} rows`
          : 'Query executed successfully. Affected 1 row.',
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
    endpoints: [
      {
        id: 'ep-health',
        method: 'GET',
        path: '/api/health',
        description: 'Verify service kernel integration health checks',
        headers: [{ key: 'Accept', value: 'application/json' }],
        params: [],
        mockResponse: JSON.stringify({ status: 'Healthy', dbConnection: 'connected', version: '1.0.0' }, null, 2),
      },
      {
        id: 'ep-prompts',
        method: 'POST',
        path: '/api/prompts/compile',
        description: 'Compiles template variables content models',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{token}}' },
        ],
        params: [
          { key: 'templateId', value: 'sql.explain', required: true },
          { key: 'values', value: '{}', required: true },
        ],
        mockResponse: JSON.stringify({ compiledText: 'Explain query plan for SELECT * FROM users;', variablesCount: 1 }, null, 2),
      },
    ],
    envVariables: {
      baseUrl: 'http://localhost:5000',
      token: 'mock-jwt-token-12345',
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
  },

  // 5. Documentation State
  doc: {
    docs: [
      {
        id: 'doc-readme',
        title: 'Project README',
        type: 'readme',
        content: '# Unify.AI Workspace\n\nDeveloper productivity suite built on modular kernel architectures.\n\n## Get Started\n\n```bash\nnpm install\nnpm run dev\n```',
        updatedAt: Date.now(),
      },
      {
        id: 'doc-api',
        title: 'API Reference',
        type: 'api',
        content: '# API Integration Routes\n\nHTTP routes configured in ASP.NET Core platform kernel controllers.\n\n### GET /api/health\nReturns 200 OK.',
        updatedAt: Date.now() - 50000,
      },
    ],
    generateDoc: (type, context) => set((state) => {
      const title = type === 'readme' ? 'README.md' : type === 'api' ? 'API_DOCS.md' : type === 'architecture' ? 'ARCHITECTURE.md' : 'CHANGELOG.md';
      const exists = state.doc.docs.some((d) => d.type === type);
      const content = `# Generated ${title}\n\nCompiled dynamically using system context filters.\n\n## Details\n- Type: ${type}\n- Context: ${context || 'General workspace context'}\n- Date: ${new Date().toLocaleDateString()}\n\n## Architecture Overview\nContains decoupled plugins bindings.`;

      if (exists) {
        return {
          doc: {
            ...state.doc,
            docs: state.doc.docs.map((d) =>
              d.type === type ? { ...d, content, updatedAt: Date.now() } : d
            ),
          },
        };
      }

      return {
        doc: {
          ...state.doc,
          docs: [
            ...state.doc.docs,
            { id: generateId(), title, type, content, updatedAt: Date.now() },
          ],
        },
      };
    }),
    updateDocContent: (id, content) => set((state) => ({
      doc: {
        ...state.doc,
        docs: state.doc.docs.map((d) =>
          d.id === id ? { ...d, content, updatedAt: Date.now() } : d
        ),
      },
    })),
  },
}));
