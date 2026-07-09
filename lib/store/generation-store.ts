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

/** Output framework for the active project (mirrors projects.framework). */
export type ProjectFramework = "react-vite" | "html";

/** Snapshot used by the undo stack. */
export interface CodeHistoryEntry {
  files: GeneratedFile[];
  code: string;
  timestamp: number;
}

/**
 * Per-run generation telemetry (wall-clock time, token count, tokens
 * per second). Today the legacy component only ever writes `null` to
 * this field — the JSX in `FileBrowser` that reads `.time`/`.tokens`
 * /`.speed` is behavior-dead until W5 wires real stats via the
 * `generateStream` `onDone` callback. The type is defined now so the
 * extracted `FileBrowser.tsx` compiles against the actual shape
 * instead of `never`.
 */
export interface GenerationStats {
  time: number;
  tokens: number;
  speed: number;
}

export interface GenerationState {
  /** Active project id, set by the workspace load (W5). */
  projectId: string | null;
  setProjectId: (value: string | null) => void;

  /** Active project's output framework (W5). */
  framework: ProjectFramework;
  setFramework: (value: ProjectFramework) => void;

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

  generationStats: GenerationStats | null;
  setGenerationStats: (value: GenerationStats | null) => void;
}

export const useGenerationStore = create<GenerationState>()((set) => ({
  projectId: null,
  setProjectId: (value) => set({ projectId: value }),

  framework: "react-vite",
  setFramework: (value) => set({ framework: value }),

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
