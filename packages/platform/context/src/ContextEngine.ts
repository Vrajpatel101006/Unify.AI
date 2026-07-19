/**
 * ContextEngine — Tracks and provides workspace context.
 */

import type { Disposable } from '@unify/kernel';
import type { ContextKey, IContextEngine, SessionInfo, WorkspaceContext } from './types';
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

export class ContextEngine implements IContextEngine {
  private _context: WorkspaceContext;
  private readonly _listeners = new Map<ContextKey, Set<(value: unknown) => void>>();

  constructor(
    private indexer?: IRepositoryIndexer,
    private git?: IGitService,
    private memory?: IWorkspaceMemory
  ) {
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

  public async buildContextPrompt(): Promise<string> {
    let prompt = `# AI Workspace Context\n\n`;

    // 1. Current File / Editor State
    if (this._context.currentFile) {
      prompt += `## Active File\n- Path: ${this._context.currentFile.path}\n- Language: ${this._context.currentFile.language}\n`;
      if (this._context.selection && this._context.selection.text) {
        prompt += `- Selected Text:\n\`\`\`${this._context.currentFile.language}\n${this._context.selection.text}\n\`\`\`\n`;
      }
      prompt += `\n`;
    }

    // 2. Git State
    if (this.git && this._context.currentWorkspace) {
      const branch = await this.git.getCurrentBranch(this._context.currentWorkspace);
      const status = await this.git.getStatus(this._context.currentWorkspace);
      if (branch) {
        prompt += `## Git State\n- Branch: ${branch}\n`;
        if (status) {
          prompt += `- Clean: ${status.isClean}\n`;
          if (status.modifiedFiles.length > 0) prompt += `- Modified: ${status.modifiedFiles.join(', ')}\n`;
        }
        prompt += `\n`;
      }
    }

    // 3. Repository Index
    if (this.indexer && this._context.currentWorkspace) {
      const index = this.indexer.getIndex(this._context.currentWorkspace);
      if (index) {
        prompt += `## Repository Architecture\n`;
        if (index.frameworks && index.frameworks.length > 0) {
          prompt += `Frameworks detected: ${index.frameworks.map(f => f.name).join(', ')}\n`;
        }
        if (index.architecture && index.architecture.nodes.length > 0) {
          prompt += `Key Symbols:\n`;
          for (const node of index.architecture.nodes.slice(0, 10)) {
            prompt += `- ${node.type}: ${node.name}\n`;
          }
        }
        prompt += `\n`;
      }
    }

    // 4. Project Memory
    if (this.memory) {
      const recentFiles = await this.memory.getRecent('recentFiles', 3);
      if (recentFiles.length > 0) {
        prompt += `## Recent Activity\n- Recently opened files: ${recentFiles.join(', ')}\n\n`;
      }
    }

    return prompt;
  }
}
