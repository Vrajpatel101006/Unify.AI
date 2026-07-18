/**
 * ContextEngine — Tracks and provides workspace context.
 */

import type { Disposable } from '@unify/kernel';
import type { ContextKey, IContextEngine, SessionInfo, WorkspaceContext } from './types';
import { generateId } from '@unify/shared';

function createDefaultContext(): WorkspaceContext {
  return {
    currentProject: null,
    currentFolder: null,
    currentFile: null,
    currentWorkspace: null,
    cursorPosition: null,
    selection: null,
    language: null,
    gitBranch: null,
    gitStatus: null,
    currentDatabase: null,
    currentAPICollection: null,
    currentPromptFolder: null,
    currentAIProvider: null,
    currentTheme: 'dark',
    workspaceVariables: {},
    openedDatabases: [],
    runningAPIs: [],
    workspaceSession: {
      id: generateId(),
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
    } satisfies SessionInfo,
    openTabs: [],
  };
}

export class ContextEngine implements IContextEngine {
  private _context: WorkspaceContext;
  private readonly _listeners = new Map<ContextKey, Set<(value: unknown) => void>>();

  constructor() {
    this._context = createDefaultContext();
  }

  get<K extends ContextKey>(key: K): WorkspaceContext[K] {
    return this._context[key];
  }

  set<K extends ContextKey>(key: K, value: WorkspaceContext[K]): void {
    this._context[key] = value;
    this._context.workspaceSession.lastActivityAt = Date.now();

    // Notify listeners
    const listeners = this._listeners.get(key);
    if (listeners) {
      for (const handler of listeners) {
        try {
          handler(value);
        } catch (err) {
          console.error(`[ContextEngine] Error in onChange handler for "${key}":`, err);
        }
      }
    }
  }

  onChange<K extends ContextKey>(key: K, handler: (value: WorkspaceContext[K]) => void): Disposable {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    const handlers = this._listeners.get(key)!;
    const wrappedHandler = handler as (value: unknown) => void;
    handlers.add(wrappedHandler);

    return {
      dispose: () => {
        handlers.delete(wrappedHandler);
        if (handlers.size === 0) this._listeners.delete(key);
      },
    };
  }

  getSnapshot(): WorkspaceContext {
    return { ...this._context };
  }

  evaluate(expression: string): boolean {
    // Simple expression evaluator for "when" clauses.
    // Supports: key == value, key != value, !key, key
    const trimmed = expression.trim();

    if (trimmed.startsWith('!')) {
      const key = trimmed.slice(1).trim() as ContextKey;
      return !this._context[key];
    }

    if (trimmed.includes('==')) {
      const [key, value] = trimmed.split('==').map((s) => s.trim());
      return String(this._context[key as ContextKey]) === value;
    }

    if (trimmed.includes('!=')) {
      const [key, value] = trimmed.split('!=').map((s) => s.trim());
      return String(this._context[key as ContextKey]) !== value;
    }

    // Truthy check
    return !!this._context[trimmed as ContextKey];
  }
}
