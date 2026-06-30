/**
 * AI Website Powerhouse — Top-level Error Boundary
 *
 * React class component that catches render-phase exceptions in its
 * subtree, logs them, and renders a recoverable error UI in place of the
 * crashed children.
 *
 * Lifted unchanged from the legacy `components/AIWebsitePowerhouse.js`
 * monolith as part of the W1 PR-1 extraction. Visual presentation,
 * recovery affordance ("Reload Application" → `window.location.reload()`),
 * and the underlying `getDerivedStateFromError` / `componentDidCatch`
 * semantics are preserved verbatim from the legacy implementation.
 */

"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

/** Props consumed by the boundary. */
export interface ErrorBoundaryProps {
  children: ReactNode;
}

/** Internal state. Captured error is null until something throws. */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Wrap any subtree that should be isolated from upstream crashes — most
 * importantly the main Builder component. When something throws during
 * render, React invokes `getDerivedStateFromError` (synchronous, here)
 * and then `componentDidCatch` (for side-effects like logging). The next
 * render returns the fallback UI instead of the broken subtree.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Keep the original console.error signature so existing debugging
    // workflows still surface the React component stack via errorInfo.
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b3d] to-[#4a1942] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-red-500/30 shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-red-300 mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Something Went Wrong
            </h2>
            <p className="text-red-200 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
