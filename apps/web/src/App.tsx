import { AppShell } from './layouts/AppShell';
import { useLayoutStore } from './stores/layoutStore';
import { Terminal, Cpu, Database, Settings2 } from 'lucide-react';
import { PromptWorkspace } from './features/PromptWorkspace';
import { AIProviderWorkspace } from './features/AIProviderWorkspace';

export function App() {
  const { activeTabId } = useLayoutStore();

  const renderActiveTab = () => {
    switch (activeTabId) {
      case 'prompt':
        return <PromptWorkspace />;
      case 'settings':
        return <AIProviderWorkspace />;
      case 'welcome':
        return (
          <div className="w-full flex flex-col p-8 max-w-3xl mx-auto gap-6 select-text">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--color-accent-primary)]">
                Unify.AI — Developer Workspace Platform
              </h2>
              <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                Become the Lead Software Architect and continue building the same codebase.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4">
                <h4 className="font-semibold text-xs text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-2">
                  <Terminal size={14} className="text-[var(--color-accent-primary)]" /> Core Engine
                </h4>
                <p className="mt-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Workspace Kernel loaded. Service container dependency injection and event loops running.
                </p>
              </div>

              <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4">
                <h4 className="font-semibold text-xs text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-2">
                  <Cpu size={14} className="text-[var(--color-accent-primary)]" /> AI Routers
                </h4>
                <p className="mt-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Decoupled LLM pipelines. Prompt builders, context injection, validation guards registered.
                </p>
              </div>

              <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4">
                <h4 className="font-semibold text-xs text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-2">
                  <Database size={14} className="text-[var(--color-accent-primary)]" /> Local Caches
                </h4>
                <p className="mt-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Local cache systems ready. Local workspace indices, database connections live.
                </p>
              </div>

              <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4">
                <h4 className="font-semibold text-xs text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-2">
                  <Settings2 size={14} className="text-[var(--color-accent-primary)]" /> Settings
                </h4>
                <p className="mt-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Multi-tier user and workspace settings configured with validation.
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--color-border-default)] pt-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Connected Workspace
              </span>
              <div className="mt-2 flex items-center justify-between rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] px-4 py-3 text-xs">
                <div>
                  <div className="font-medium text-[var(--color-text-primary)]">local-project</div>
                  <div className="mt-0.5 text-[var(--color-text-muted)]">C:\Users\dell\Desktop\Unify.AI</div>
                </div>
                <div className="rounded bg-[var(--color-bg-hover)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-text-secondary)]">
                  Ready
                </div>
              </div>
            </div>
          </div>
        );
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
