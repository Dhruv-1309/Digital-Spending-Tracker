import { Component, type ReactNode, type ErrorInfo } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[360px] flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full rounded-2xl border border-border-subtle bg-surface-elevated p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <svg
                aria-hidden="true"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            <h2 className="font-display text-xl font-semibold text-text-primary">
              Something went unexpectedly wrong
            </h2>

            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              MoneyTracker encountered an unhandled rendering error. Your financial data is safely stored in your local offline cache.
            </p>

            {this.state.error && import.meta.env.DEV && (
              <div className="mt-4 max-h-32 overflow-auto rounded-lg bg-surface-subtle p-3 text-left font-mono text-xs text-rose-400">
                {this.state.error.message}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="rounded-xl border border-border-subtle bg-surface-subtle px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-elevated transition-colors"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-95 transition-opacity"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
