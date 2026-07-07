"use client";

/**
 * Skeleton — pulsing placeholder block for loading states.
 *
 * Created (unused) in W1 PR-5 per the Section 6 §2 target file map
 * ("future use; created empty in W1"). First real consumers arrive
 * with the W2 dashboard/auth pages and the W6 Sandpack preview
 * loading states.
 */

import { memo } from "react";

export interface SkeletonProps {
  /** Extra Tailwind classes for sizing/shape, e.g. "h-4 w-32". */
  className?: string;
}

export const Skeleton = memo(function Skeleton({
  className = "",
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-purple-500/20 ${className}`}
    />
  );
});
