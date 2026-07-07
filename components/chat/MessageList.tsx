"use client";

/**
 * MessageList — the scrolling chat-thread view inside ChatInterface.
 * Auto-scrolls to the newest message whenever the history changes.
 *
 * Reads `chatHistory` from the chat store. No props. The index key on
 * the message rows is carried over from the legacy render — messages
 * are append-only within a session, so index identity is stable.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo, useEffect, useRef } from "react";
import { useChatStore } from "@/lib/store/chat-store";

export const MessageList = memo(function MessageList() {
  const chatHistory = useChatStore((s) => s.chatHistory);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-0">
      {chatHistory.map((message, index) => (
        <div
          key={index}
          className={`p-3 rounded-lg ${
            message.role === "user"
              ? "bg-purple-500/20 border border-purple-500/30 text-purple-100 ml-8"
              : "bg-orange-500/20 border border-orange-500/30 text-orange-100 mr-8"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );
});
