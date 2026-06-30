/**
 * AI Website Powerhouse — generation in-memory store.
 *
 * Holds the live generation state: the current prompt, the streaming
 * `generatedCode` buffer, the parsed file list, the selected file, the
 * `isGenerating` flag, the `codeHistory` undo stack, and the
 * `generationStats` placeholder (always `null` today; reserved for
 * W5+ when token/cost stats are wired in).
 *
 * NOT persisted via Zustand middleware: the legacy "autosave" snapshot
 * captured a *subset* of this state (files + code + chatHistory) under
 * the `aiwebsite_autosave` key and was restored *on user action* via
 * the RestoreWorkModal. That manual snapshot flow is preserved in
 * `lib/store/autosave.ts` and is independent of this store.
 */

import { create } from "zustand";
import type { GeneratedFile } from "@/lib/generation/types";

/** Snapshot used by the undo stack. */
export interface CodeHistoryEntry {
  files: GeneratedFile[];
  code: string;
  timestamp: number;
}

/**
 * Placeholder for future per-run generation telemetry (token counts,
 * wall-clock time, cost). Today the legacy component only ever sets
 * this to `null`, so the type is fixed to `null` and will be widened
 * when real stats land in W5.
 */
export type GenerationStats = null;

export interface GenerationState {
  prompt: string;
  setPrompt: (value: string) => void;

  generatedCode: string;
  setGeneratedCode: (value: string) => void;

  generatedFiles: GeneratedFile[];
  setGeneratedFiles: (value: GeneratedFile[]) => void;

  selectedFile: GeneratedFile | null;
  setSelectedFile: (value: GeneratedFile | null) => void;

  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;

  codeHistory: CodeHistoryEntry[];
  setCodeHistory: (
    updater: CodeHistoryEntry[] | ((prev: CodeHistoryEntry[]) => CodeHistoryEntry[]),
  ) => void;

  generationStats: GenerationStats;
  setGenerationStats: (value: GenerationStats) => void;
}

export const useGenerationStore = create<GenerationState>()((set) => ({
  prompt: "",
  setPrompt: (value) => set({ prompt: value }),

  generatedCode: "",
  setGeneratedCode: (value) => set({ generatedCode: value }),

  generatedFiles: [],
  setGeneratedFiles: (value) => set({ generatedFiles: value }),

  selectedFile: null,
  setSelectedFile: (value) => set({ selectedFile: value }),

  isGenerating: false,
  setIsGenerating: (value) => set({ isGenerating: value }),

  codeHistory: [],
  setCodeHistory: (updater) =>
    set((state) => ({
      codeHistory:
        typeof updater === "function" ? updater(state.codeHistory) : updater,
    })),

  generationStats: null,
  setGenerationStats: (value) => set({ generationStats: value }),
}));
