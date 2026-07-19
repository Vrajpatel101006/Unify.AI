/**
 * @unify/platform-context
 *
 * Context Engine — tracks current project state, editor state,
 * git state, workspace variables, and session info.
 * AI becomes much smarter when it has full context.
 */

import type { Disposable } from '@unify/kernel';

// ---------------------------------------------------------------------------
// Context Data Structures
// ---------------------------------------------------------------------------

export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  language?: string;
}

export interface FileInfo {
  path: string;
  name: string;
  language: string;
  size: number;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
  text: string;
}

export interface GitStatus {
  branch: string;
  isDirty: boolean;
  staged: number;
  unstaged: number;
  untracked: number;
}

export interface DatabaseInfo {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'mongodb';
  connectionString?: string;
  isConnected: boolean;
}

export interface APIInfo {
  id: string;
  name: string;
  baseUrl: string;
  isRunning: boolean;
}

export interface TabInfo {
  id: string;
  title: string;
  type: string;
  path?: string;
  isActive: boolean;
  isDirty: boolean;
}

export interface SessionInfo {
  id: string;
  startedAt: number;
  lastActivityAt: number;
}

// ---------------------------------------------------------------------------
// Full Workspace Context
// ---------------------------------------------------------------------------

export interface WorkspaceContext {
  // Project
  currentProject: ProjectInfo | null;
  currentFolder: string | null;
  currentFile: FileInfo | null;
  currentWorkspace: string | null;

  // Editor
  cursorPosition: CursorPosition | null;
  selection: SelectionRange | null;
  language: string | null;

  // Git
  gitBranch: string | null;
  gitStatus: GitStatus | null;

  // Workspace
  currentDatabase: DatabaseInfo | null;
  currentAPICollection: string | null;
  currentPromptFolder: string | null;
  currentAIProvider: string | null;
  currentTheme: string;
  workspaceVariables: Record<string, unknown>;

  // Session
  openedDatabases: DatabaseInfo[];
  runningAPIs: APIInfo[];
  workspaceSession: SessionInfo;
  openTabs: TabInfo[];
}

// ---------------------------------------------------------------------------
// Context Key (for typed access)
// ---------------------------------------------------------------------------

export type ContextKey = keyof WorkspaceContext;

// ---------------------------------------------------------------------------
// Context Engine Interface
// ---------------------------------------------------------------------------

export interface IContextEngine {
  get<K extends ContextKey>(key: K): WorkspaceContext[K];
  set<K extends ContextKey>(key: K, value: WorkspaceContext[K]): void;
  onChange<K extends ContextKey>(key: K, handler: (value: WorkspaceContext[K]) => void): Disposable;
  getSnapshot(): WorkspaceContext;

  evaluate(expression: string): boolean;

  /** Build a structured workspace context model for AI routing */
  buildWorkspaceContext(): Promise<WorkspaceContextModel>;
  
  /** Register a context provider */
  registerProvider(provider: IContextProvider<any>): void;
}

export interface WorkspaceContextModel {
  project?: any;
  git?: any;
  repository?: any;
  currentFile?: any;
  selection?: any;
  recentActivity?: any[];
  databases?: any[];
  apis?: any[];
  prompts?: any[];
}

export interface IContextProvider<T = any> {
  name: string;
  provideContext(context: WorkspaceContext): Promise<T | null>;
}
