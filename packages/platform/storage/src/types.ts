/**
 * @unify/platform-storage — Storage abstraction (local-first).
 * PostgreSQL for application data, SQLite for local workspace/cache.
 */

export interface IStorageService {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}

export type WorkspaceTable = 'projects' | 'prompts' | 'history' | 'settings' | 'plugins' | 'recent_files' | 'layouts' | 'ai_usage' | 'indexes' | 'favorites';

export interface IWorkspaceDatabase {
  get<T>(table: WorkspaceTable, id: string): Promise<T | undefined>;
  getAll<T>(table: WorkspaceTable): Promise<T[]>;
  put<T>(table: WorkspaceTable, id: string, data: T): Promise<void>;
  delete(table: WorkspaceTable, id: string): Promise<void>;
  query<T>(table: WorkspaceTable, predicate: (item: T) => boolean): Promise<T[]>;
  clear(table: WorkspaceTable): Promise<void>;
  close(): Promise<void>;
}
