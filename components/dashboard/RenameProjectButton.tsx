"use client";

/**
 * RenameProjectButton — pencil affordance on dashboard project cards
 * (2026-07-12, user-reported indistinguishable date-named projects).
 * Client island inside the server-rendered card; the card itself is
 * a Link, so the click must not navigate.
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { renameProject } from "@/lib/projects/actions";

export function RenameProjectButton({
  projectId,
  currentName,
}: {
  projectId: string;
  currentName: string;
}) {
  const router = useRouter();

  const handleClick = useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const name = window.prompt("Project name:", currentName);
      if (name === null) return;
      const trimmed = name.trim();
      if (trimmed.length === 0 || trimmed === currentName) return;
      try {
        await renameProject(projectId, trimmed);
        router.refresh();
      } catch (error) {
        alert(
          `Could not rename: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
    [projectId, currentName, router],
  );

  return (
    <button
      onClick={(e) => void handleClick(e)}
      title="Rename project"
      className="shrink-0 p-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/30 text-orange-300/70 hover:text-orange-200 transition-colors"
    >
      <Pencil className="w-4 h-4" />
    </button>
  );
}
