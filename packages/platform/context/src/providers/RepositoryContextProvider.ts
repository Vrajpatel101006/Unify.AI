import type { WorkspaceContext, IContextProvider } from '../types';
import type { IRepositoryIndexer } from '@unify/platform-indexing';

export class RepositoryContextProvider implements IContextProvider {
  name = 'repository';

  constructor(private indexer: IRepositoryIndexer) {}

  public async provideContext(context: WorkspaceContext): Promise<any | null> {
    if (!context.currentWorkspace) return null;

    const index = this.indexer.getIndex(context.currentWorkspace);
    return index || null;
  }
}
