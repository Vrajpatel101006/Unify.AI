import { Terminal, Database, Send, BookOpen, Settings, Moon, Sun } from 'lucide-react';
import { useLayoutStore } from '../stores/layoutStore';

export function ActivityBar() {
  const { activeActivity, setActiveActivity, theme, toggleTheme } = useLayoutStore();

  const activities = [
    { id: 'welcome', icon: Terminal, label: 'Welcome' },
    { id: 'prompt', icon: Send, label: 'Prompt Workspace' },
    { id: 'database', icon: Database, label: 'Database Workspace' },
    { id: 'docs', icon: BookOpen, label: 'Documentation' },
  ];

  return (
    <div
      className="flex h-full w-[var(--size-activity-bar)] flex-col items-center justify-between border-r border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] py-3"
      style={{ minWidth: 'var(--size-activity-bar)' }}
    >
      {/* Top Activities */}
      <div className="flex flex-col gap-2 w-full items-center">
        {activities.map((act) => {
          const Icon = act.icon;
          const isActive = activeActivity === act.id;

          return (
            <button
              key={act.id}
              onClick={() => setActiveActivity(act.id)}
              title={act.label}
              className={`group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all ${
                isActive
                  ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {/* Left active line indicator */}
              {isActive && (
                <div className="absolute left-0 top-2 h-6 w-0.5 rounded bg-[var(--color-accent-primary)]" />
              )}
              <Icon size={18} strokeWidth={1.8} />
            </button>
          );
        })}
      </div>

      {/* Bottom Actions (Theme Toggle & Settings) */}
      <div className="flex flex-col gap-2 w-full items-center">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-all"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={() => setActiveActivity('settings')}
          title="Settings"
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all ${
            activeActivity === 'settings'
              ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent-primary)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
