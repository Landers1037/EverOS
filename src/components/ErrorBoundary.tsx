"use client";
import { Component, type ReactNode } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error }: { error: Error | null }) {
  return (
    <div
      className="flex items-center justify-center h-full w-full p-8"
      style={{ backgroundColor: "var(--bg-elevated)" }}
    >
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--accent-muted)" }}
        >
          <span className="text-2xl" style={{ color: "var(--accent)" }}>
            !
          </span>
        </div>
        <h2
          className="text-lg font-semibold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Something went wrong
        </h2>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--text-tertiary)" }}
        >
          {error?.message ?? "An unexpected error occurred"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "var(--fill-solid)", color: "var(--fill-solid-contrast)" }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}