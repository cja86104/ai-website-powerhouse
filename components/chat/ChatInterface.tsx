"use client";

/**
 * ChatInterface — the "Modify with Chat" card: title row with the
 * Undo affordance, the MessageList thread, and (once code exists)
 * the MessageInput row.
 *
 * Owns the undo action: it only touches the generation and chat
 * stores, so it moved off the legacy main component with this
 * extraction. The `data-shortcut="undo"` attribute is preserved for
 * the global Ctrl/Cmd+Z handler on the main component.
 *
 * `onChatSubmit` is passed through to `MessageInput` — see that
 * component's header for why the callback still lives on the parent.
 *
 * Since W8 Mon it also owns the file-scope picker: "Whole project"
 * (default) or one generated file. The selection lives on the chat
 * store; Builder's handleChatModify reads it to pick the scoped
 * single-file contract over the full-replacement one.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo, useCallback, useMemo } from "react";
import { FileCode2, Undo } from "lucide-react";
import { useChatStore } from "@/lib/store/chat-store";
import { useGenerationStore } from "@/lib/store/generation-store";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";

export interface ChatInterfaceProps {
  /** See MessageInput. */
  onChatSubmit: () => void;
}

export const ChatInterface = memo(function ChatInterface({
  onChatSubmit,
}: ChatInterfaceProps) {
  const generatedCode = useGenerationStore((s) => s.generatedCode);
  const setGeneratedCode = useGenerationStore((s) => s.setGeneratedCode);
  const setGeneratedFiles = useGenerationStore((s) => s.setGeneratedFiles);
  const setSelectedFile = useGenerationStore((s) => s.setSelectedFile);
  const codeHistory = useGenerationStore((s) => s.codeHistory);
  const setCodeHistory = useGenerationStore((s) => s.setCodeHistory);
  const setChatHistory = useChatStore((s) => s.setChatHistory);
  const generatedFiles = useGenerationStore((s) => s.generatedFiles);
  const scopedFilePath = useChatStore((s) => s.scopedFilePath);
  const setScopedFilePath = useChatStore((s) => s.setScopedFilePath);

  const hasGeneratedCode = useMemo(
    () => generatedCode.length > 0,
    [generatedCode],
  );
  const canUndo = useMemo(() => codeHistory.length > 0, [codeHistory]);

  // Undo last change — pops the newest snapshot off the history stack
  // and restores it. Lifted verbatim from the legacy main component.
  const undoLastChange = useCallback(() => {
    if (codeHistory.length === 0) return;

    const previousState = codeHistory[codeHistory.length - 1];
    setGeneratedCode(previousState.code);
    setGeneratedFiles(previousState.files);
    setSelectedFile(previousState.files[0]);
    setCodeHistory((prev) => prev.slice(0, -1));

    const undoMessage = {
      role: "assistant" as const,
      content: "Reverted to previous version",
    };
    setChatHistory((prev) => [...prev, undoMessage]);
  }, [
    codeHistory,
    setGeneratedCode,
    setGeneratedFiles,
    setSelectedFile,
    setCodeHistory,
    setChatHistory,
  ]);

  return (
    <div
      // Layout fix (2026-07-19): the left rail scrolls now, so flex-1
      // no longer bounds this card. With code present the card takes a
      // fixed height and the thread scrolls internally; before any
      // generation it keeps filling the leftover column space.
      className={`bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-purple-500/30 shadow-2xl p-6 flex flex-col ${
        hasGeneratedCode ? "h-[420px] shrink-0" : "flex-1 min-h-0"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-purple-100">Modify with Chat</h2>
        {canUndo && (
          <button
            onClick={undoLastChange}
            data-shortcut="undo"
            className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
          >
            <Undo className="w-4 h-4" />
            Undo
          </button>
        )}
      </div>

      {hasGeneratedCode && (
        <div className="flex items-center gap-2 mb-3">
          <FileCode2 className="w-4 h-4 text-purple-300 shrink-0" />
          <select
            value={scopedFilePath ?? ""}
            onChange={(e) =>
              setScopedFilePath(e.target.value === "" ? null : e.target.value)
            }
            className="flex-1 px-3 py-1.5 text-sm bg-[#1a1a2e] border border-purple-500/30 rounded-lg text-purple-100 focus:outline-none focus:border-purple-500/50"
            title="Scope the next request to one file, or the whole project"
          >
            <option value="">Whole project</option>
            {generatedFiles.map((file) => (
              <option key={file.name} value={file.name}>
                Only {file.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <MessageList />

      {hasGeneratedCode && <MessageInput onChatSubmit={onChatSubmit} />}
    </div>
  );
});
