/**
 * AI Website Powerhouse — UI in-memory store.
 *
 * Holds transient UI flags that do not need to survive reloads:
 *  - modal visibility booleans
 *  - the preview-mode toggle ("code" | "live")
 *  - the OpenRouter server-availability probe result (runtime, not
 *    persisted)
 *  - the GitHub-panel form fields (repo name, description, commit
 *    message, clone URL) and the in-flight `isGithubProcessing` flag
 *
 * NOT persisted.
 *
 * `previewMode` dropped its third "auto" value (2026-07-14,
 * user-reported blank preview on load): for react-vite projects "auto"
 * and "live" always evaluated identically in PreviewPanel, so it was a
 * confusing third state that never did anything different — "live" is
 * now the default and the only non-code state.
 */

import { create } from "zustand";

/** Preview pane mode. `live` shows a live preview for HTML files only. */
export type PreviewMode = "code" | "live";

export interface UiState {
  // Modal/panel visibility
  showSettings: boolean;
  setShowSettings: (value: boolean) => void;
  showTemplates: boolean;
  setShowTemplates: (value: boolean) => void;
  showGithubPanel: boolean;
  setShowGithubPanel: (value: boolean) => void;
  showDeployModal: boolean;
  setShowDeployModal: (value: boolean) => void;

  // Preview pane
  /** Preview-only numbered badges on image slots (2026-07-12). */
  showImageSlots: boolean;
  setShowImageSlots: (value: boolean) => void;

  previewMode: PreviewMode;
  setPreviewMode: (
    updater: PreviewMode | ((prev: PreviewMode) => PreviewMode),
  ) => void;

  // OpenRouter server-side proxy availability probe
  openrouterServerAvailable: boolean | null;
  setOpenrouterServerAvailable: (value: boolean | null) => void;

  // GitHub panel transient form state
  isGithubProcessing: boolean;
  setIsGithubProcessing: (value: boolean) => void;
  repoName: string;
  setRepoName: (value: string) => void;
  repoDescription: string;
  setRepoDescription: (value: string) => void;
  commitMessage: string;
  setCommitMessage: (value: string) => void;
  cloneUrl: string;
  setCloneUrl: (value: string) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  showSettings: false,
  setShowSettings: (value) => set({ showSettings: value }),
  showTemplates: false,
  setShowTemplates: (value) => set({ showTemplates: value }),
  showGithubPanel: false,
  setShowGithubPanel: (value) => set({ showGithubPanel: value }),
  showDeployModal: false,
  setShowDeployModal: (value) => set({ showDeployModal: value }),

  showImageSlots: false,
  setShowImageSlots: (value) => set({ showImageSlots: value }),

  previewMode: "live",
  setPreviewMode: (updater) =>
    set((state) => ({
      previewMode:
        typeof updater === "function" ? updater(state.previewMode) : updater,
    })),

  openrouterServerAvailable: null,
  setOpenrouterServerAvailable: (value) =>
    set({ openrouterServerAvailable: value }),

  isGithubProcessing: false,
  setIsGithubProcessing: (value) => set({ isGithubProcessing: value }),
  repoName: "",
  setRepoName: (value) => set({ repoName: value }),
  repoDescription: "",
  setRepoDescription: (value) => set({ repoDescription: value }),
  commitMessage: "Update website",
  setCommitMessage: (value) => set({ commitMessage: value }),
  cloneUrl: "",
  setCloneUrl: (value) => set({ cloneUrl: value }),
}));
