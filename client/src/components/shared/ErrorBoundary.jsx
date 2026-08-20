import { Component } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

/**
 * Last line of defence against a white screen.
 *
 * A render error anywhere below this boundary produces a readable recovery
 * screen instead of an empty document. Route-level failures are handled closer
 * to the data by ErrorState; this catches the ones nothing else expected.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Wire to Sentry/LogRocket here when observability lands.
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  handleReload = () => window.location.reload();

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-5">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg hairline">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-danger-50 text-danger-600">
            <TriangleAlert className="size-6" aria-hidden="true" />
          </div>

          <h1 className="mt-5 text-xl font-semibold text-navy-950">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-navy-500">
            An unexpected error stopped this page from loading. Reloading usually fixes it — your data is safe.
          </p>

          {import.meta.env.DEV && (
            <pre className="scrollbar-slim mt-4 max-h-40 overflow-auto rounded-lg bg-navy-950 p-3 text-left text-2xs leading-relaxed text-navy-200">
              {error.message}
            </pre>
          )}

          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-navy-950 transition-colors duration-150 hover:bg-primary-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
