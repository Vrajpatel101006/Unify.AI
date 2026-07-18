/**
 * App — Root component for Unify.AI web application.
 *
 * Phase 1: Minimal shell to verify the build works.
 * Phase 4 will add the full AppShell with sidebar, topbar, statusbar.
 */

export function App() {
  return (
    <div
      className="flex h-screen w-screen items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--color-accent-primary)' }}>
          Unify.AI
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          AI-powered Developer Workspace Platform
        </p>
        <p className="mt-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Foundation v0.1.0 — Phase 1 Complete
        </p>
      </div>
    </div>
  )
}
