/**
 * ContextEngine — Tracks and provides workspace context.
 */

import type { Disposable } from '@unify/kernel';
import type { ContextKey, IContextEngine, SessionInfo, WorkspaceContext, WorkspaceContextModel, IContextProvider } from './types';
import { generateId } from '@unify/shared';
import type { IRepositoryIndexer } from '@unify/platform-indexing';
import type { IGitService } from '@unify/platform-git';
import type { IWorkspaceMemory } from '@unify/platform-memory';

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

import type { ICacheManager } from '@unify/platform-cache';
import { createHash } from 'crypto';

export class ContextEngine implements IContextEngine {
  private _context: WorkspaceContext;
  private readonly _listeners = new Map<ContextKey, Set<(value: unknown) => void>>();
  private readonly _providers: IContextProvider<any>[] = [];

  private indexer?: IRepositoryIndexer;
  private git?: IGitService;
  private memory?: IWorkspaceMemory;
  private cacheManager?: ICacheManager;

  constructor(
    indexer?: IRepositoryIndexer,
    git?: IGitService,
    memory?: IWorkspaceMemory,
    cacheManager?: ICacheManager
  ) {
    this.indexer = indexer;
    this.git = git;
    this.memory = memory;
    this.cacheManager = cacheManager;
    this._context = createDefaultContext();
  }

  get<K extends ContextKey>(key: K): WorkspaceContext[K] {
    return this._context[key];
  }

  set<K extends ContextKey>(key: K, value: WorkspaceContext[K]): void {
    this._context[key] = value;
    this._context.workspaceSession.lastActivityAt = Date.now();

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
    return !!this._context[trimmed as ContextKey];
  }

  public registerProvider(provider: IContextProvider<any>): void {
    this._providers.push(provider);
  }

  public async buildWorkspaceContext(): Promise<WorkspaceContextModel> {
    let cacheKey = '';
    let cache;
    if (this.cacheManager) {
      // Build a cache key representing the exact state
      const stateStr = JSON.stringify({
        project: this._context.currentProject?.id,
        file: this._context.currentFile?.path,
        selection: this._context.selection?.text,
        git: this._context.gitStatus,
        branch: this._context.gitBranch
      });
      cacheKey = createHash('md5').update(stateStr).digest('hex');
      
      cache = this.cacheManager.getMemoryCache('workspaceContext');
      const cached = await cache.get<WorkspaceContextModel>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const model: WorkspaceContextModel = {};
    
    // Core built-in fields
    if (this._context.currentProject) {
      model.project = this._context.currentProject;
    }
    if (this._context.currentFile) {
      model.currentFile = this._context.currentFile;
    }
    if (this._context.selection) {
      model.selection = this._context.selection;
    }

    // Call all registered providers
    for (const provider of this._providers) {
      try {
        const data = await provider.provideContext(this._context);
        if (data) {
          // Merge provider data into model based on provider name
          (model as any)[provider.name] = data;
        }
      } catch (err) {
        console.error(`[ContextEngine] Provider ${provider.name} failed:`, err);
      }
    }

    if (cache && cacheKey) {
      await cache.set(cacheKey, model, 60000); // 1 minute TTL
    }

    return model;
  }
}
