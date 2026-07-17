"use client";

/**
 * DeleteProjectButton — trash affordance on dashboard project cards
 * (2026-07-17, user request: saved projects had no delete). Client
 * island inside the server-rendered card; the card itself is a Link,
 * so the click must not navigate. Deletion is permanent (generations,
 * files, chat, uploaded images all go with it), so the confirm
 * requires the user to acknowledge by name.
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteProject } from "@/lib/projects/actions";

export function DeleteProjectButton({
  projectId,
  currentName,
}: {
  projectId: string;
  currentName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleClick = useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (busy) return;
      if (
        !window.confirm(
          `Delete "${currentName}" permanently?\n\nThis removes the project, its full version history, chat, and uploaded images. This cannot be undone.`,
        )
      ) {
        return;
      }
      setBusy(true);
      try {
        await deleteProject(projectId);
        router.refresh();
      } catch (error) {
        alert(
          `Could not delete: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      } finally {
        setBusy(false);
      }
    },
    [projectId, currentName, router, busy],
  );

  return (
    <button
      onClick={(e) => void handleClick(e)}
      title="Delete project"
      disabled={busy}
      className="shrink-0 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-300/70 hover:text-red-200 transition-colors disabled:opacity-50"
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
