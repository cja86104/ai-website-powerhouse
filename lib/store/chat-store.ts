/**
 * AI Website Powerhouse — chat in-memory store.
 *
 * Holds the chat thread between the user and the model during a
 * generation session. Two fields:
 *  - `chatHistory`: the rolling list of {role, content} messages
 *    displayed in the ChatInterface.
 *  - `chatMessage`: the current draft in the chat input.
 *
 * NOT persisted directly. The legacy `aiwebsite_autosave` snapshot
 * captured `chatHistory` together with the files/code; that
 * user-initiated snapshot is preserved in `lib/store/autosave.ts`.
 */

import { create } from "zustand";

/** One message in the chat thread. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatState {
  chatHistory: ChatMessage[];
  setChatHistory: (
    updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[]),
  ) => void;

  chatMessage: string;
  setChatMessage: (value: string) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  chatHistory: [],
  setChatHistory: (updater) =>
    set((state) => ({
      chatHistory:
        typeof updater === "function" ? updater(state.chatHistory) : updater,
    })),

  chatMessage: "",
  setChatMessage: (value) => set({ chatMessage: value }),
}));
