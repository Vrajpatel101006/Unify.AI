import type { WorkspaceContext, IContextProvider } from '../types';
import type { IWorkspaceMemory } from '@unify/platform-memory';

export class MemoryContextProvider implements IContextProvider {
  name = 'recentActivity';

  constructor(private memory: IWorkspaceMemory) {}

  public async provideContext(context: WorkspaceContext): Promise<any | null> {
    const recentFiles = await this.memory.getRecent('recentFiles', 5);
    const recentConversations = await this.memory.getRecent('recentConversations', 3);
    
    return {
      recentFiles,
      recentConversations
    };
  }
}
