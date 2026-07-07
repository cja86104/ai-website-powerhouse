"use client";

/**
 * RestoreWorkModal — the "Restore Previous Work?" prompt shown when an
 * autosave snapshot exists at mount (the main component flips
 * `showRestoreModal` after `hasSnapshot()`).
 *
 * Owns both actions: Restore loads the snapshot into the generation +
 * chat stores; Start Fresh clears it. Both close the modal. This is a
 * user-confirmed load, deliberately not an automatic rehydrate — see
 * `lib/store/autosave.ts`.
 *
 * All hooks are declared before the `if (!showRestoreModal) return
 * null` guard — hooks-order rule per Section 6 §6. No props.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo, useCallback } from "react";
import { Archive } from "lucide-react";
import { useChatStore } from "@/lib/store/chat-store";
import { useGenerationStore } from "@/lib/store/generation-store";
import { useUiStore } from "@/lib/store/ui-store";
import { clearSnapshot, loadSnapshot } from "@/lib/store/autosave";

export const RestoreWorkModal = memo(function RestoreWorkModal() {
  const showRestoreModal = useUiStore((s) => s.showRestoreModal);
  const setShowRestoreModal = useUiStore((s) => s.setShowRestoreModal);
  const setGeneratedCode = useGenerationStore((s) => s.setGeneratedCode);
  const setGeneratedFiles = useGenerationStore((s) => s.setGeneratedFiles);
  const setSelectedFile = useGenerationStore((s) => s.setSelectedFile);
  const setChatHistory = useChatStore((s) => s.setChatHistory);

  // Restore saved work — lifted verbatim from the legacy main component.
  const restoreSavedWork = useCallback(() => {
    const snapshot = loadSnapshot();
    if (snapshot) {
      setGeneratedFiles(snapshot.files);
      setGeneratedCode(snapshot.code);
      setChatHistory(snapshot.chatHistory);
      setSelectedFile(snapshot.files[0] || null);
    }
    setShowRestoreModal(false);
  }, [
    setGeneratedFiles,
    setGeneratedCode,
    setChatHistory,
    setSelectedFile,
    setShowRestoreModal,
  ]);

  // Discard saved work.
  const discardSavedWork = useCallback(() => {
    clearSnapshot();
    setShowRestoreModal(false);
  }, [setShowRestoreModal]);

  if (!showRestoreModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-orange-500/30 shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-orange-100 mb-4 flex items-center gap-2">
          <Archive className="w-6 h-6" />
          Restore Previous Work?
        </h2>
        <p className="text-orange-200 mb-6">
          We found unsaved work from your last session. Would you like to
          restore it?
        </p>
        <div className="flex gap-3">
          <button
            onClick={restoreSavedWork}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Restore Work
          </button>
          <button
            onClick={discardSavedWork}
            className="flex-1 py-3 px-6 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-semibold transition-colors"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
});
