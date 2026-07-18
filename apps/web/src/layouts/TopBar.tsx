import { Menu, Search, X } from 'lucide-react';
import { useLayoutStore } from '../stores/layoutStore';

export function TopBar() {
  const { sidebarOpen, toggleSidebar, openTabs, activeTabId, setActiveTabId, closeTab } = useLayoutStore();

  return (
    <div
      className="flex h-[var(--size-topbar)] w-full items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3"
      style={{ height: 'var(--size-topbar)' }}
    >
      {/* Left side — sidebar toggle & tabs */}
      <div className="flex items-center gap-2 h-full overflow-hidden">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            title="Expand Sidebar"
            className="mr-1 rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] cursor-pointer"
          >
            <Menu size={15} />
          </button>
        )}

        {/* Tab Strip */}
        <div className="flex h-full items-end overflow-x-auto select-none no-scrollbar">
          {openTabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group flex h-[var(--size-tab-height)] min-w-[80px] max-w-[150px] cursor-pointer items-center justify-between border-r border-[var(--color-border-default)] px-3 text-xs transition-all ${
                  isActive
                    ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-medium border-t-2 border-t-[var(--color-accent-primary)]'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                }`}
              >
                <span className="truncate pr-2">{tab.title}</span>
                {openTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="rounded p-0.5 opacity-0 hover:bg-[var(--color-bg-hover)] group-hover:opacity-100 hover:text-[var(--color-status-error)] transition-all cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right side — universal search box (simulated cmd palette shortcut trigger) */}
      <div className="flex items-center pr-2">
        <button
          title="Search or execute command (Ctrl+K)"
          className="flex items-center gap-2 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-1 text-[11px] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)] transition-all cursor-pointer"
        >
          <Search size={11} />
          <span>Search...</span>
          <kbd className="rounded bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 text-[9px] font-mono border border-[var(--color-border-default)]">Ctrl+K</kbd>
        </button>
      </div>
    </div>
  );
}
