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

/**
 * Chat/Plan mode (2026-08-01, Chat/Plan Mode work-plan item 3,
 * PLAN/Feature-Chat-Plan-Mode.md §7 decision 1). "build" is today's
 * unchanged behavior — every chat-panel send goes through
 * `handleChatModify`'s file-delta contract. "plan" is strictly
 * read + discuss — see `lib/prompts/plan-mode-prompt.ts`.
 */
export type ChatMode = "build" | "plan";

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
  /** Uploaded images for the current project (2026-07-12) — the
   * generation prompts hand these URLs to the model. */
  assets: { name: string; url: string }[];
  setAssets: (value: { name: string; url: string }[]) => void;
  setProjectId: (value: string | null) => void;

  /** Active project's output framework (W5). */
  framework: ProjectFramework;
  setFramework: (value: ProjectFramework) => void;

  /**
   * Whether the active project has a saved Supabase connection
   * (2026-07-31, Connect Your Supabase — PLAN/Feature-Connect-Your-Supabase.md).
   * Loaded with the workspace (lib/projects/actions.ts WorkspacePayload)
   * and updated live by SupabaseConnectSection after a save/clear, so
   * ChipRow/SystemStatusList never need their own fetch. Boolean only
   * — the URL/anon key themselves are loaded on demand by the Settings
   * card via lib/supabase-connect/actions.ts, never cached here.
   */
  supabaseConnected: boolean;
  setSupabaseConnected: (value: boolean) => void;

  /**
   * Whether the active project has a saved Stripe connection
   * (2026-08-01, Connect Your Stripe — mirrors supabaseConnected
   * exactly). Publishable key only; never a secret key. Loaded with the
   * workspace and updated live by StripeConnectSection after a
   * save/clear.
   */
  stripeConnected: boolean;
  setStripeConnected: (value: boolean) => void;

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

  /**
   * Which contract the next chat-panel send uses (2026-08-01). Reset
   * to "build" on every project load and on New Project — same
   * per-project-generation-state posture as `scopedFilePath` in
   * `chat-store.ts` (never persisted, never carries across projects,
   * so nobody gets stuck unable to build).
   */
  chatMode: ChatMode;
  setChatMode: (value: ChatMode) => void;
}

export const useGenerationStore = create<GenerationState>()((set) => ({
  projectId: null,
  setProjectId: (value) => set({ projectId: value }),
  assets: [],
  setAssets: (value) => set({ assets: value }),

  framework: "react-vite",
  setFramework: (value) => set({ framework: value }),

  supabaseConnected: false,
  setSupabaseConnected: (value) => set({ supabaseConnected: value }),

  stripeConnected: false,
  setStripeConnected: (value) => set({ stripeConnected: value }),

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

  chatMode: "build",
  setChatMode: (value) => set({ chatMode: value }),
}));
