import type { ReactNode } from 'react';
import { ActivityBar } from './ActivityBar';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { StatusBar } from './StatusBar';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ErrorBoundary>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans select-none">
        {/* Main Work Area */}
        <div className="flex flex-1 overflow-hidden w-full">
          {/* Activity Bar (Vertical Left Edge) */}
          <ActivityBar />

          {/* Collapsible Sidebar */}
          <Sidebar />

          {/* Editor/Workspace Content Window */}
          <div className="flex flex-1 flex-col overflow-hidden min-w-0">
            {/* Tab Strip / Universal Actions Bar */}
            <TopBar />

            {/* Main view content (tab components) */}
            <div className="flex-1 overflow-y-auto bg-[var(--color-bg-primary)] relative">
              {children}
            </div>
          </div>
        </div>

        {/* Footer StatusBar */}
        <StatusBar />
      </div>
    </ErrorBoundary>
  );
}
