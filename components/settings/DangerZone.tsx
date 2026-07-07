"use client";

/**
 * DangerZone — the "Clear Saved Work" card at the bottom of the
 * Settings panel. Wipes the autosave snapshot after a confirm()
 * prompt.
 *
 * No store reads — the action goes straight to the autosave helper.
 * No props.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { clearSnapshot } from "@/lib/store/autosave";

export const DangerZone = memo(function DangerZone() {
  const clearSavedWork = useCallback(() => {
    if (
      confirm(
        "Are you sure you want to clear all saved work? This cannot be undone.",
      )
    ) {
      clearSnapshot();
      alert("Saved work cleared successfully!");
    }
  }, []);

  return (
    <div className="mt-6 bg-gradient-to-br from-red-500/10 to-transparent rounded-xl p-6 border border-red-500/20">
      <h3 className="text-xl font-bold text-red-100 mb-4 flex items-center gap-2">
        <Trash2 className="w-5 h-5" />
        Danger Zone
      </h3>
      <p className="text-red-200 mb-4 text-sm">
        Clear all auto-saved work from local storage. This cannot be undone.
      </p>
      <button
        onClick={clearSavedWork}
        className="w-full py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-semibold transition-colors"
      >
        Clear Saved Work
      </button>
    </div>
  );
});
