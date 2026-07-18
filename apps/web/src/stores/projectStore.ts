import { create } from 'zustand';
import { generateId } from '@unify/shared';

export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  gitBranch: string;
  gitStatus: {
    isDirty: boolean;
    staged: string[];
    unstaged: string[];
    untracked: string[];
  };
  commitHistory: {
    hash: string;
    message: string;
    author: string;
    date: string;
  }[];
}

export interface WorkspaceConnection {
  id: string;
  name: string;
  type: 'database' | 'api';
  status: 'connected' | 'disconnected' | 'running' | 'stopped';
  detail: string;
}

export interface AIMemoryNote {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

interface ProjectStore {
  currentProject: ProjectInfo | null;
  recentProjects: Omit<ProjectInfo, 'gitStatus' | 'commitHistory'>[];
  connections: WorkspaceConnection[];
  notes: AIMemoryNote[];

  setCurrentProject: (proj: ProjectInfo | null) => void;
  addRecentProject: (proj: Omit<ProjectInfo, 'gitStatus' | 'commitHistory'>) => void;
  addConnection: (conn: Omit<WorkspaceConnection, 'id'>) => void;
  removeConnection: (id: string) => void;
  toggleConnectionStatus: (id: string) => void;
  addNote: (title: string, content: string) => void;
  updateNote: (id: string, title: string, content: string) => void;
  deleteNote: (id: string) => void;
}

const DEFAULT_PROJECT: ProjectInfo = {
  id: 'unify-core',
  name: 'Unify.AI Workspace',
  path: 'C:\\Users\\dell\\Desktop\\Unify.AI',
  gitBranch: 'main',
  gitStatus: {
    isDirty: true,
    staged: ['apps/web/src/index.css', 'packages/platform/storage/src/WorkspaceDatabase.ts'],
    unstaged: ['apps/web/src/layouts/AppShell.tsx'],
    untracked: ['apps/api/nuget.config'],
  },
  commitHistory: [
    { hash: 'ab9b528', message: 'feat: implement AI Provider Manager and Prompt Workspace features', author: 'Vraj Patel', date: '5 mins ago' },
    { hash: '818b3be', message: 'fix: resolve dashboard squeezed layout by remapping spacing namespaces', author: 'Vraj Patel', date: '30 mins ago' },
    { hash: 'f302a84', message: 'feat: complete Phase 6 - Search, Notification and Health checks', author: 'Vraj Patel', date: '2 hours ago' },
  ],
};

const DEFAULT_CONNECTIONS: WorkspaceConnection[] = [
  { id: 'db-local', name: 'PostgreSQL Local', type: 'database', status: 'connected', detail: 'localhost:5432/unify' },
  { id: 'db-cache', name: 'SQLite Workspace Cache', type: 'database', status: 'connected', detail: 'Local Disk: sqlite.db' },
  { id: 'api-health', name: 'Health Endpoint API', type: 'api', status: 'running', detail: 'http://localhost:5000/api/health' },
];

const DEFAULT_NOTES: AIMemoryNote[] = [
  { id: 'n-1', title: 'System Environment Settings', content: 'Ensure postgresql port is mapped to localhost:5432 for database connection test validation.', updatedAt: Date.now() },
  { id: 'n-2', title: 'AI Provider Latency Checklist', content: 'Gemini 2.5 flash is preferred for sql/prompt builders tasks, use Claude for advanced code analyzer logic refactoring.', updatedAt: Date.now() - 360000 },
];

export const useProjectStore = create<ProjectStore>((set) => ({
  currentProject: DEFAULT_PROJECT,
  recentProjects: [
    { id: 'unify-core', name: 'Unify.AI Workspace', path: 'C:\\Users\\dell\\Desktop\\Unify.AI', gitBranch: 'main' },
    { id: 'react-app', name: 'Product Store web app', path: 'C:\\Users\\dell\\Desktop\\ProductStore', gitBranch: 'master' },
  ],
  connections: DEFAULT_CONNECTIONS,
  notes: DEFAULT_NOTES,

  setCurrentProject: (proj) => set(() => ({ currentProject: proj })),

  addRecentProject: (proj) => set((state) => {
    const exists = state.recentProjects.some((p) => p.id === proj.id);
    if (exists) return {};
    return { recentProjects: [proj, ...state.recentProjects] };
  }),

  addConnection: (conn) => set((state) => ({
    connections: [...state.connections, { ...conn, id: generateId() }],
  })),

  removeConnection: (id) => set((state) => ({
    connections: state.connections.filter((c) => c.id !== id),
  })),

  toggleConnectionStatus: (id) => set((state) => ({
    connections: state.connections.map((c) => {
      if (c.id === id) {
        let status: WorkspaceConnection['status'] = 'connected';
        if (c.type === 'database') {
          status = c.status === 'connected' ? 'disconnected' : 'connected';
        } else {
          status = c.status === 'running' ? 'stopped' : 'running';
        }
        return { ...c, status };
      }
      return c;
    }),
  })),

  addNote: (title, content) => set((state) => ({
    notes: [...state.notes, { id: generateId(), title, content, updatedAt: Date.now() }],
  })),

  updateNote: (id, title, content) => set((state) => ({
    notes: state.notes.map((n) =>
      n.id === id ? { ...n, title, content, updatedAt: Date.now() } : n
    ),
  })),

  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id),
  })),
}));
export type { ProjectStore };
