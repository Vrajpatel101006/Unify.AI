import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  openLocalProject: (path: string) => Promise<void>;
  cloneProject: (url: string, destPath: string) => Promise<void>;
  refreshGitStatus: () => Promise<void>;
  getGitDiff: (stagedOnly?: boolean) => Promise<string>;
  commitChanges: (message: string, files: string[]) => Promise<void>;
  pushProject: () => Promise<void>;
  pullProject: () => Promise<void>;
  
  pendingCommitMessage: string;
  setPendingCommitMessage: (msg: string) => void;

  githubToken: string | null;
  githubRepos: any[];
  setGithubToken: (token: string | null) => void;
  fetchGithubRepos: () => Promise<void>;
  createGithubRepo: (name: string, destPath: string) => Promise<void>;

  hfToken: string | null;
  setHfToken: (token: string | null) => void;
}

const DEFAULT_CONNECTIONS: WorkspaceConnection[] = [
  { id: 'db-local', name: 'PostgreSQL Local', type: 'database', status: 'connected', detail: 'localhost:5432/unify' },
  { id: 'db-cache', name: 'SQLite Workspace Cache', type: 'database', status: 'connected', detail: 'Local Disk: sqlite.db' },
  { id: 'api-health', name: 'Health Endpoint API', type: 'api', status: 'running', detail: 'http://localhost:5000/api/health' },
];

const DEFAULT_NOTES: AIMemoryNote[] = [
  { id: 'n-1', title: 'System Environment Settings', content: 'Ensure postgresql port is mapped to localhost:5432 for database connection test validation.', updatedAt: Date.now() },
  { id: 'n-2', title: 'AI Provider Latency Checklist', content: 'Gemini 2.5 flash is preferred for sql/prompt builders tasks, use Claude for advanced code analyzer logic refactoring.', updatedAt: Date.now() - 360000 },
];

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      currentProject: null,
      recentProjects: [
        { id: 'unify-core', name: 'Unify.AI Workspace', path: 'C:\\Users\\dell\\Desktop\\Unify.AI', gitBranch: 'main' },
        { id: 'react-app', name: 'Product Store web app', path: 'C:\\Users\\dell\\Desktop\\ProductStore', gitBranch: 'master' },
      ],
      connections: DEFAULT_CONNECTIONS,
      notes: DEFAULT_NOTES,

      setCurrentProject: (proj) => set(() => ({ currentProject: proj })),
      
      pendingCommitMessage: '',
      setPendingCommitMessage: (msg: string) => set({ pendingCommitMessage: msg }),

      addRecentProject: (proj) => set((state) => {
        const exists = state.recentProjects.some((p) => p.id === proj.id);
        if (exists) return {};
        return { recentProjects: [proj, ...state.recentProjects] };
      }),

      removeRecentProject: (id: string) => set((state) => ({
        recentProjects: state.recentProjects.filter((p) => p.id !== id)
      })),

      addConnection: (conn) => set((state) => ({ connections: [...state.connections, { ...conn, id: generateId() }] })),

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

      openLocalProject: async (path: string) => {
        try {
          const statusRes = await fetch(`/api/local/git/status?path=${encodeURIComponent(path)}`);
          const { branch, status } = await statusRes.json();
          
          const historyRes = await fetch(`/api/local/git/history?path=${encodeURIComponent(path)}`);
          const { history } = await historyRes.json();

          const name = path.split(/[/\\]/).pop() || 'Unknown Project';

          const proj: ProjectInfo = {
            id: generateId(),
            name,
            path,
            gitBranch: branch || 'unknown',
            gitStatus: status ? {
              isDirty: !status.isClean,
              staged: status.stagedFiles || [],
              unstaged: status.modifiedFiles || [],
              untracked: status.untrackedFiles || []
            } : { isDirty: false, staged: [], unstaged: [], untracked: [] },
            commitHistory: history || []
          };

          set({ currentProject: proj });
          get().addRecentProject({ id: proj.id, name: proj.name, path: proj.path, gitBranch: proj.gitBranch });
        } catch (err) {
          console.error('Failed to open project', err);
        }
      },

      cloneProject: async (url: string, destPath: string) => {
        try {
          await fetch('/api/local/git/clone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, destPath })
          });
          await get().openLocalProject(destPath);
        } catch (err) {
          console.error('Failed to clone project', err);
        }
      },

      refreshGitStatus: async () => {
        const proj = get().currentProject;
        if (!proj) return;
        await get().openLocalProject(proj.path);
      },

      getGitDiff: async (stagedOnly: boolean = false) => {
        const proj = get().currentProject;
        if (!proj) return '';
        try {
          const res = await fetch('/api/local/git/diff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: proj.path, stagedOnly })
          });
          const data = await res.json();
          return data.diff || '';
        } catch (err) {
          console.error('Failed to get diff', err);
          return '';
        }
      },

      commitChanges: async (message: string, files: string[]) => {
        const proj = get().currentProject;
        if (!proj) return;
        try {
          await fetch('/api/local/git/commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: proj.path, message, files })
          });
          await get().refreshGitStatus();
        } catch (err) {
          console.error('Failed to commit', err);
        }
      },

      pushProject: async () => {
        const proj = get().currentProject;
        if (!proj) return;
        try {
          await fetch('/api/local/git/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: proj.path })
          });
          await get().refreshGitStatus();
        } catch (err) {
          console.error('Failed to push', err);
        }
      },

      pullProject: async () => {
        const proj = get().currentProject;
        if (!proj) return;
        try {
          await fetch('/api/local/git/pull', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: proj.path })
          });
          await get().refreshGitStatus();
        } catch (err) {
          console.error('Failed to pull', err);
        }
      },
      
      githubToken: null,
      githubRepos: [],
      setGithubToken: (token) => {
        set({ githubToken: token });
        if (token) {
          get().fetchGithubRepos();
        } else {
          set({ githubRepos: [] });
        }
      },
      
      hfToken: null,
      setHfToken: (token) => set({ hfToken: token }),
      
      fetchGithubRepos: async () => {
        const token = get().githubToken;
        if (!token) return;
        try {
          const res = await fetch('/api/local/git/list-github-repos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          if (res.status === 401 || res.status === 403) {
            get().setGithubToken(null);
            throw new Error('GitHub token expired or invalid. Please connect your account again.');
          }
          if (!res.ok) throw new Error('Failed to fetch repos');
          const { repos } = await res.json();
          set({ githubRepos: repos });
        } catch (err) {
          console.error('Failed to fetch github repos', err);
          alert(err);
        }
      },

      createGithubRepo: async (name: string, destPath: string) => {
        const token = get().githubToken;
        if (!token) return;
        try {
          const res = await fetch('/api/local/git/create-github-repo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, destPath, token })
          });
          if (res.status === 401 || res.status === 403) {
            get().setGithubToken(null);
            throw new Error('GitHub token expired or invalid. Please connect your account again.');
          }
          if (!res.ok) throw new Error('Failed to create repo');
          await get().openLocalProject(destPath);
        } catch (err) {
          console.error('Failed to create github repo', err);
          alert(err);
        }
      }
    }),
    {
      name: 'unify-project-store',
      partialize: (state) => ({ githubToken: state.githubToken, hfToken: state.hfToken }),
    }
  )
);
export type { ProjectStore };
