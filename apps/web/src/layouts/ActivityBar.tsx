import { useState, useRef, useEffect } from 'react';
import { Terminal, Database, Send, BookOpen, Settings, Moon, Sun, Network, Cpu, Globe, MessageSquare, LogOut, User, HelpCircle } from 'lucide-react';
import { useLayoutStore } from '../stores/layoutStore';
import { useAuthStore } from '../stores/authStore';

export function ActivityBar() {
  const { activeActivity, setActiveActivity, theme, toggleTheme, addTab } = useLayoutStore();
  const { user, logout } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activities = [
    { id: 'welcome', icon: Terminal, label: 'Welcome', tabTitle: 'Welcome', tabType: 'welcome' },
    { id: 'repo-intel', icon: Network, label: 'Repository Intelligence', tabTitle: 'Repo Intel', tabType: 'repo-intel' },
    { id: 'code-intel', icon: Cpu, label: 'Code Intelligence', tabTitle: 'Code Intel', tabType: 'code-intel' },
    { id: 'ai-chat', icon: MessageSquare, label: 'AI Chat Workspace', tabTitle: 'AI Chat', tabType: 'ai-chat' },
    { id: 'prompt', icon: Send, label: 'Prompt Workspace', tabTitle: 'Prompts', tabType: 'prompt' },
    { id: 'database', icon: Database, label: 'Database Workspace', tabTitle: 'Database', tabType: 'database' },
    { id: 'api', icon: Globe, label: 'API Workspace', tabTitle: 'API Workspace', tabType: 'api' },
    { id: 'docs', icon: BookOpen, label: 'Documentation', tabTitle: 'Docs', tabType: 'docs' },
  ];

  const handleActivityClick = (id: string, tabTitle: string, tabType: string) => {
    setActiveActivity(id);
    addTab({ id, title: tabTitle, type: tabType });
  };

  return (
    <div
      className="flex h-full w-[var(--size-activity-bar)] flex-col items-center justify-between border-r border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] py-3 relative z-30"
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
              onClick={() => handleActivityClick(act.id, act.tabTitle, act.tabType)}
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

      {/* Bottom Actions (Theme Toggle, Settings & User Profile) */}
      <div className="flex flex-col gap-2 w-full items-center">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-all"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={() => {
            setActiveActivity('settings');
            addTab({ id: 'settings', title: 'AI Providers', type: 'settings' });
          }}
          title="Settings"
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all ${
            activeActivity === 'settings'
              ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent-primary)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Settings size={18} />
        </button>

        <button
          onClick={() => {
            setActiveActivity('help');
            addTab({ id: 'help', title: 'Help Center', type: 'help' });
          }}
          title="Help & Guides"
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all ${
            activeActivity === 'help'
              ? 'bg-[var(--color-bg-hover)] text-[var(--color-accent-primary)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <HelpCircle size={18} />
        </button>

        {/* User Profile Avatar with Dropdown */}
        {user && (
          <div className="relative mt-1" ref={menuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border-default)] overflow-hidden hover:opacity-80 transition-opacity"
              title={user.name}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <User size={14} className="text-[var(--color-text-primary)]" />
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute bottom-0 left-[var(--size-activity-bar)] ml-2 w-64 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-4 shadow-2xl z-50 flex flex-col gap-3 select-text">
                <div className="flex gap-2.5 items-center">
                  <div className="h-10 w-10 rounded-full border border-[var(--color-border-default)] overflow-hidden shrink-0">
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[var(--color-text-primary)] truncate">{user.name}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] truncate">{user.email}</div>
                  </div>
                </div>

                <div className="border-t border-[var(--color-border-default)] pt-2.5 flex flex-col gap-1.5">
                  <div className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Sign in Method
                  </div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] font-semibold capitalize flex items-center gap-1">
                    <span>{user.provider}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setActiveActivity('profile');
                    addTab({ id: 'profile', title: 'User Profile', type: 'profile' });
                  }}
                  className="w-full rounded-lg bg-[var(--color-accent-primary)]/10 hover:bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)] py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[var(--color-accent-primary)]/25"
                >
                  <User size={13} />
                  <span>Edit Profile Details</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full rounded-lg bg-[var(--color-status-error)]/10 hover:bg-[var(--color-status-error)]/15 text-[var(--color-status-error)] py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[var(--color-status-error)]/25"
                >
                  <LogOut size={13} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

