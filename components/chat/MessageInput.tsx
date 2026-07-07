"use client";

/**
 * MessageInput — the chat draft input + send button inside
 * ChatInterface. Enter submits when a generation is not in flight and
 * the draft is non-empty.
 *
 * Reads `chatMessage` (draft) and `isGenerating` from the stores.
 *
 * `onChatSubmit` stays a prop because `handleChatModify` closes over
 * the full provider/sampling config on the legacy main component —
 * same reasoning as `PromptForm.onGenerate` (see that component's
 * header). Candidate for a future `useGeneration()` hook.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo } from "react";
import { Loader2, Send } from "lucide-react";
import { useChatStore } from "@/lib/store/chat-store";
import { useGenerationStore } from "@/lib/store/generation-store";

export interface MessageInputProps {
  /** Submits the current draft as a modify request. */
  onChatSubmit: () => void;
}

export const MessageInput = memo(function MessageInput({
  onChatSubmit,
}: MessageInputProps) {
  const chatMessage = useChatStore((s) => s.chatMessage);
  const setChatMessage = useChatStore((s) => s.setChatMessage);
  const isGenerating = useGenerationStore((s) => s.isGenerating);

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={chatMessage}
        onChange={(e) => setChatMessage(e.target.value)}
        onKeyDown={(e) =>
          e.key === "Enter" &&
          !isGenerating &&
          chatMessage.trim() &&
          onChatSubmit()
        }
        placeholder="Ask to modify the website..."
        className="flex-1 px-4 py-3 bg-[#1a1a2e] border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500/50"
      />
      <button
        onClick={onChatSubmit}
        disabled={isGenerating || !chatMessage.trim()}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  );
});
