/**
 * WorkspaceDatabase — Mock implementation representing local storage.
 * In a real build this wraps IndexedDB on the web and SQLite in Electron.
 */

import type { IWorkspaceDatabase, WorkspaceTable } from './types';

export class WorkspaceDatabase implements IWorkspaceDatabase {
  private readonly _tables = new Map<WorkspaceTable, Map<string, unknown>>();
  private _closed = false;

  constructor() {
    this._initTables();
  }

  async get<T>(table: WorkspaceTable, id: string): Promise<T | undefined> {
    this._ensureOpen();
    return this._getTable(table).get(id) as T | undefined;
  }

  async getAll<T>(table: WorkspaceTable): Promise<T[]> {
    this._ensureOpen();
    return Array.from(this._getTable(table).values()) as T[];
  }

  async put<T>(table: WorkspaceTable, id: string, data: T): Promise<void> {
    this._ensureOpen();
    this._getTable(table).set(id, data);
  }

  async delete(table: WorkspaceTable, id: string): Promise<void> {
    this._ensureOpen();
    this._getTable(table).delete(id);
  }

  async query<T>(table: WorkspaceTable, predicate: (item: T) => boolean): Promise<T[]> {
    this._ensureOpen();
    const items = await this.getAll<T>(table);
    return items.filter(predicate);
  }

  async clear(table: WorkspaceTable): Promise<void> {
    this._ensureOpen();
    this._getTable(table).clear();
  }

  async close(): Promise<void> {
    this._closed = true;
  }

  private _getTable(table: WorkspaceTable): Map<string, unknown> {
    if (!this._tables.has(table)) {
      this._tables.set(table, new Map());
    }
    return this._tables.get(table)!;
  }

  private _initTables(): void {
    const tableNames: WorkspaceTable[] = [
      'projects',
      'prompts',
      'history',
      'settings',
      'plugins',
      'recent_files',
      'layouts',
      'ai_usage',
      'indexes',
      'favorites',
    ];
    for (const name of tableNames) {
      this._tables.set(name, new Map());
    }
  }

  private _ensureOpen(): void {
    if (this._closed) {
      throw new Error('[WorkspaceDatabase] Database is closed.');
    }
  }
}
