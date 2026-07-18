/**
 * @unify/platform-memory — Workspace memory: remembers state across sessions.
 */

export interface WorkspaceMemoryState {
  recentFiles: string[];
  recentSQL: string[];
  recentConversations: string[];
  pinnedPrompts: string[];
  favorites: string[];
  openTabs: string[];
  recentProjects: string[];
  workspaceLayout: Record<string, unknown>;
}

export interface IWorkspaceMemory {
  save(state: Partial<WorkspaceMemoryState>): Promise<void>;
  load(): Promise<WorkspaceMemoryState>;
  addRecent(category: keyof WorkspaceMemoryState, item: string): Promise<void>;
  getRecent(category: keyof WorkspaceMemoryState, limit?: number): Promise<string[]>;
  clear(): Promise<void>;
}
