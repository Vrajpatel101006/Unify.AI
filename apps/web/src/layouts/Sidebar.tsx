import { ChevronLeft, History, Settings2, Plus, Terminal } from 'lucide-react';
import { useLayoutStore } from '../stores/layoutStore';

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, activeActivity } = useLayoutStore();

  if (!sidebarOpen) return null;

  const renderContent = () => {
    switch (activeActivity) {
      case 'welcome':
        return (
          <div className="flex flex-col p-3 gap-2">
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Quick Start
            </h3>
            <div className="flex flex-col gap-1 mt-2">
              <button className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] cursor-pointer text-left w-full">
                <Terminal size={14} /> New Session
              </button>
            </div>
          </div>
        );
      case 'prompt':
        return (
          <div className="flex flex-col p-3 gap-2">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Prompts
              </h3>
              <button title="Create Prompt" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer">
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <button className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] cursor-pointer text-left w-full">
                <History size={14} /> Prompt History
              </button>
            </div>
          </div>
        );
      case 'database':
        return (
          <div className="flex flex-col p-3 gap-2">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Connections
              </h3>
              <button title="Add Connection" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer">
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-1 mt-2 text-[var(--color-text-muted)] text-[11px] px-2 mt-4 text-center">
              No databases connected
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="flex flex-col p-3 gap-2">
            <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Configuration
            </h3>
            <div className="flex flex-col gap-1 mt-2">
              <button className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] cursor-pointer text-left w-full">
                <Settings2 size={14} /> General Settings
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4 text-xs text-[var(--color-text-muted)] text-center">
            No options available
          </div>
        );
    }
  };

  return (
    <div
      className="flex h-full w-[var(--size-sidebar)] flex-col border-r border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)]"
      style={{ width: 'var(--size-sidebar)' }}
    >
      {/* Title / Collapser Header */}
      <div className="flex h-[var(--size-topbar)] items-center justify-between border-b border-[var(--color-border-default)] px-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {activeActivity === 'welcome' ? 'Workspace' : activeActivity}
        </span>
        <button
          onClick={() => setSidebarOpen(false)}
          title="Collapse Sidebar"
          className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] cursor-pointer"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Dynamic Content */}
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
    </div>
  );
}
