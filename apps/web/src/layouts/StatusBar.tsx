import { GitBranch, Shield, Cpu, Bell } from 'lucide-react';

export function StatusBar() {
  return (
    <div
      className="flex h-[var(--size-statusbar)] w-full items-center justify-between border-t border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 text-[11px] text-[var(--color-text-secondary)]"
      style={{ height: 'var(--size-statusbar)' }}
    >
      {/* Left items — workspace state */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-medium text-[var(--color-accent-primary)]">
          <Shield size={12} />
          <span>Unify.AI</span>
        </div>
        <div className="flex items-center gap-1">
          <GitBranch size={11} />
          <span>main</span>
        </div>
        <div className="text-[var(--color-text-muted)]">Connected: local-project</div>
      </div>

      {/* Right items — settings / notifications */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Cpu size={11} />
          <span>Gemini 2.5 Flash</span>
        </div>
        <button title="Notifications" className="flex items-center gap-1 hover:text-[var(--color-text-primary)] cursor-pointer">
          <Bell size={11} />
          <span>0</span>
        </button>
        <span className="text-[var(--color-text-muted)]">v0.1.0</span>
      </div>
    </div>
  );
}
