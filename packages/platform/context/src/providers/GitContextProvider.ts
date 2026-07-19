import type { WorkspaceContext, IContextProvider } from '../types';
import type { IGitService } from '@unify/platform-git';

export class GitContextProvider implements IContextProvider {
  name = 'git';

  constructor(private git: IGitService) {}

  public async provideContext(context: WorkspaceContext): Promise<any | null> {
    if (!context.currentWorkspace) return null;

    const branch = await this.git.getCurrentBranch(context.currentWorkspace);
    const status = await this.git.getStatus(context.currentWorkspace);

    return {
      branch,
      status
    };
  }
}
