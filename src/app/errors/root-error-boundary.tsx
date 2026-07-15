import { Component, type ErrorInfo, type ReactNode } from "react";

import { mapError } from "@/lib/errors";
import { captureUnexpectedError } from "@/lib/monitoring/sentry";

interface RootErrorBoundaryProps {
  children: ReactNode;
}

interface RootErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

export class RootErrorBoundary extends Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  state: RootErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): RootErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    captureUnexpectedError(error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const error = mapError(this.state.error);
    return (
      <main className="grid min-h-screen place-items-center px-6 py-16">
        <section className="max-w-xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{error.title}</h1>
          <p className="mt-4 text-muted-foreground">{error.message}</p>
          <button
            className="mt-8 underline underline-offset-4"
            type="button"
            onClick={() => window.location.reload()}
          >
            Reload application
          </button>
        </section>
      </main>
    );
  }
}
