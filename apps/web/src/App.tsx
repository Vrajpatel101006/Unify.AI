import { useState } from 'react';
import { AppShell } from './layouts/AppShell';
import { useLayoutStore } from './stores/layoutStore';
import { useAuthStore } from './stores/authStore';
import { LandingWorkspace } from './features/LandingWorkspace';
import { LoginWorkspace } from './features/LoginWorkspace';
import { PromptWorkspace } from './features/PromptWorkspace';
import { AIProviderWorkspace } from './features/AIProviderWorkspace';
import { ProjectWorkspace } from './features/ProjectWorkspace';
import { RepositoryIntelligence } from './features/RepositoryIntelligence';
import { CodeIntelligence } from './features/CodeIntelligence';
import { DatabaseWorkspace } from './features/DatabaseWorkspace';
import { ApiWorkspace } from './features/ApiWorkspace';
import { DocumentationWorkspace } from './features/DocumentationWorkspace';
import { AIChatWorkspace } from './features/AIChatWorkspace';
import { HelpWorkspace } from './features/HelpWorkspace';
import { ProfileWorkspace } from './features/ProfileWorkspace';

export function App() {
  const { activeTabId } = useLayoutStore();
  const { isAuthenticated } = useAuthStore();
  const [showLanding, setShowLanding] = useState(true);

  if (showLanding) {
    return <LandingWorkspace onComplete={() => setShowLanding(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginWorkspace />;
  }

  const renderActiveTab = () => {
    switch (activeTabId) {
      case 'prompt':
        return <PromptWorkspace />;
      case 'ai-chat':
        return <AIChatWorkspace />;
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
      case 'help':
        return <HelpWorkspace />;
      case 'profile':
        return <ProfileWorkspace />;
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
