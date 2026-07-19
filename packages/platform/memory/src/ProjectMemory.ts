import * as fs from 'fs';
import * as path from 'path';
import { IWorkspaceMemory, WorkspaceMemoryState } from './types';

const DEFAULT_STATE: WorkspaceMemoryState = {
  recentFiles: [],
  recentSQL: [],
  recentConversations: [],
  pinnedPrompts: [],
  favorites: [],
  openTabs: [],
  recentProjects: [],
  workspaceLayout: {},
};

export class ProjectMemory implements IWorkspaceMemory {
  private memoryPath: string;

  constructor(workspaceRoot: string) {
    const unifyDir = path.join(workspaceRoot, '.unify');
    if (!fs.existsSync(unifyDir)) {
      fs.mkdirSync(unifyDir, { recursive: true });
    }
    this.memoryPath = path.join(unifyDir, 'memory.json');
  }

  public async save(state: Partial<WorkspaceMemoryState>): Promise<void> {
    const currentState = await this.load();
    const newState = { ...currentState, ...state };
    await fs.promises.writeFile(this.memoryPath, JSON.stringify(newState, null, 2), 'utf-8');
  }

  public async load(): Promise<WorkspaceMemoryState> {
    if (!fs.existsSync(this.memoryPath)) {
      return { ...DEFAULT_STATE };
    }
    try {
      const content = await fs.promises.readFile(this.memoryPath, 'utf-8');
      return { ...DEFAULT_STATE, ...JSON.parse(content) };
    } catch (err) {
      console.error('Failed to load project memory', err);
      return { ...DEFAULT_STATE };
    }
  }

  public async addRecent(category: keyof WorkspaceMemoryState, item: string): Promise<void> {
    const state = await this.load();
    const arr = state[category];
    if (Array.isArray(arr)) {
      const filtered = (arr as string[]).filter(x => x !== item);
      filtered.unshift(item);
      state[category] = filtered as any;
      await this.save(state);
    }
  }

  public async getRecent(category: keyof WorkspaceMemoryState, limit?: number): Promise<string[]> {
    const state = await this.load();
    const arr = state[category];
    if (Array.isArray(arr)) {
      return limit ? arr.slice(0, limit) : arr;
    }
    return [];
  }

  public async clear(): Promise<void> {
    if (fs.existsSync(this.memoryPath)) {
      await fs.promises.unlink(this.memoryPath);
    }
  }
}
