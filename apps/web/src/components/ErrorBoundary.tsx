import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex h-screen w-screen flex-col items-center justify-center bg-[var(--color-bg-primary)] p-6 text-[var(--color-text-primary)]">
            <div className="max-w-md rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-[var(--color-status-error)] flex items-center gap-2">
                ⚠️ Something went wrong
              </h2>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                The workspace encountered an unexpected error. You can try to reload the session.
              </p>
              {this.state.error && (
                <pre className="mt-4 overflow-auto rounded bg-[var(--color-bg-tertiary)] p-3 text-[11px] font-mono text-[var(--color-text-muted)] max-h-40">
                  {this.state.error.stack || this.state.error.message}
                </pre>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={this.handleReset}
                  className="rounded bg-[var(--color-accent-primary)] px-4 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)] transition-all cursor-pointer"
                >
                  Reload Workspace
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
