"use client";

/**
 * HistoryPanel — the per-project version history (W7 Wed/Thu).
 *
 * Collapsed by default to keep the left column compact; expanding it
 * fetches the project's complete generations (newest first) via
 * `listGenerations`. Each entry offers:
 *
 *  - **Open** — loads that version's file snapshot into the workspace
 *    (delegated to Builder via `onRestore` so the modify chain can be
 *    re-pointed at the restored generation — the next chat edit
 *    branches from THAT version, which is exactly what
 *    `parent_generation_id` models).
 *  - **Fork** — `forkFromGeneration` copies the snapshot into a brand
 *    new project server-side and navigates to it; the source project
 *    and its history stay untouched.
 *
 * All hooks are declared before any conditional return — hooks-order
 * rule per Section 6 §6.
 */

import { memo, useCallback, useState } from "react";
import { GitBranch, History, Loader2, RotateCcw } from "lucide-react";
import { useGenerationStore } from "@/lib/store/generation-store";
import {
  forkFromGeneration,
  listGenerations,
  type GenerationSummary,
} from "@/lib/projects/actions";

export interface HistoryPanelProps {
  /** Loads a historical version into the workspace (Builder-owned). */
  onRestore: (generationId: string) => Promise<void>;
}

/** Human label for the generation kind. */
function kindLabel(kind: GenerationSummary["kind"]): string {
  if (kind === "initial") return "Created";
  if (kind === "restore") return "Forked in";
  return "Edited";
}

/** Compact local time, e.g. "Jul 9, 3:42 PM". */
function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const HistoryPanel = memo(function HistoryPanel({
  onRestore,
}: HistoryPanelProps) {
  const projectId = useGenerationStore((s) => s.projectId);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<GenerationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Which entry has an in-flight action, so double-clicks are inert.
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (projectId === null) return;
    setLoading(true);
    setError(null);
    try {
      setEntries(await listGenerations(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      if (next) void refresh();
      return next;
    });
  }, [refresh]);

  const handleOpen = useCallback(
    async (generationId: string) => {
      setBusyId(generationId);
      try {
        await onRestore(generationId);
      } catch (err) {
        alert(
          `Could not open that version: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      } finally {
        setBusyId(null);
      }
    },
    [onRestore],
  );

  const handleFork = useCallback(async (generationId: string) => {
    if (
      !confirm(
        "Fork this version into a new project? The current project stays exactly as it is.",
      )
    ) {
      return;
    }
    setBusyId(generationId);
    try {
      const newProjectId = await forkFromGeneration(generationId);
      window.location.href = `/p/${newProjectId}`;
    } catch (err) {
      alert(
        `Could not fork: ${err instanceof Error ? err.message : String(err)}`,
      );
      setBusyId(null);
    }
  }, []);

  if (projectId === null) return null;

  return (
    <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-amber-500/30 shadow-2xl">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-6 py-3 text-amber-100 font-semibold"
      >
        <span className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Version History
        </span>
        <span className="text-xs text-amber-300/60">
          {expanded ? "Hide" : "Show"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 max-h-64 overflow-y-auto space-y-2">
          {loading && (
            <p className="flex items-center gap-2 text-sm text-amber-200/70 px-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading history…
            </p>
          )}
          {error !== null && (
            <p className="text-sm text-red-300 px-2">
              Could not load history: {error}
            </p>
          )}
          {!loading && error === null && entries.length === 0 && (
            <p className="text-sm text-amber-200/60 px-2">
              No saved versions yet — generate a website and each round
              will appear here.
            </p>
          )}
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-amber-500/20 bg-[#1a1a2e] p-3"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-amber-300">
                  {kindLabel(entry.kind)}
                </span>
                <span className="text-xs text-amber-200/50">
                  {formatTime(entry.createdAt)}
                </span>
              </div>
              <p
                className="text-sm text-amber-100/80 truncate mb-2"
                title={entry.prompt}
              >
                {entry.prompt}
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-amber-200/40 truncate">
                  {entry.model}
                </span>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => void handleOpen(entry.id)}
                    disabled={busyId !== null}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 disabled:opacity-50 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Open
                  </button>
                  <button
                    onClick={() => void handleFork(entry.id)}
                    disabled={busyId !== null}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 disabled:opacity-50 transition-colors"
                  >
                    <GitBranch className="w-3 h-3" />
                    Fork
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
