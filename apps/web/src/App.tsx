import { AppShell } from './layouts/AppShell';
import { useLayoutStore } from './stores/layoutStore';
import { PromptWorkspace } from './features/PromptWorkspace';
import { AIProviderWorkspace } from './features/AIProviderWorkspace';
import { ProjectWorkspace } from './features/ProjectWorkspace';
import { RepositoryIntelligence } from './features/RepositoryIntelligence';
import { CodeIntelligence } from './features/CodeIntelligence';
import { DatabaseWorkspace } from './features/DatabaseWorkspace';
import { ApiWorkspace } from './features/ApiWorkspace';
import { DocumentationWorkspace } from './features/DocumentationWorkspace';

export function App() {
  const { activeTabId } = useLayoutStore();

  const renderActiveTab = () => {
    switch (activeTabId) {
      case 'prompt':
        return <PromptWorkspace />;
      case 'settings':
        return <AIProviderWorkspace />;
      case 'database':
        return <DatabaseWorkspace />;
      case 'repo-intel':
        return <RepositoryIntelligence />;
      case 'code-intel':
        return <CodeIntelligence />;
      case 'api':
        return <ApiWorkspace />;
      case 'docs':
        return <DocumentationWorkspace />;
      case 'welcome':
        return <ProjectWorkspace />;
      default:
        return (
          <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-muted)]">
            Workspace feature view is not implemented yet.
          </div>
        );
    }
  };

  return <AppShell>{renderActiveTab()}</AppShell>;
}
