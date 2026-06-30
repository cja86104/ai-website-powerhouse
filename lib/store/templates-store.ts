/**
 * AI Website Powerhouse — user-saved prompt templates store.
 *
 * Persists the user's saved prompt templates (the "Save current prompt
 * as template" feature). Today these are stored under the legacy
 * `aiwebsite_user_templates` localStorage key; this store moves them
 * under `aiwp-templates-v1` via the migration helper.
 *
 * Deviation from Section 6 §2: that section's store list does not
 * include a templates store because the `userTemplates` state variable
 * was omitted from the §1 inventory table. This file fills that gap.
 *
 * Hydration is deferred via `skipHydration: true` so the wrapping
 * `<HydrationGate>` can run the legacy-localStorage migration first.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** A single user-saved prompt template, as authored via "Save current prompt". */
export interface UserTemplate {
  id: string;
  name: string;
  prompt: string;
  createdAt: number;
}

export interface TemplatesState {
  userTemplates: UserTemplate[];
  addUserTemplate: (template: UserTemplate) => void;
  removeUserTemplate: (id: string) => void;
}

interface TemplatesPersistedSlice {
  userTemplates: UserTemplate[];
}

export const useTemplatesStore = create<TemplatesState>()(
  persist(
    (set) => ({
      userTemplates: [],
      addUserTemplate: (template) =>
        set((state) => ({ userTemplates: [...state.userTemplates, template] })),
      removeUserTemplate: (id) =>
        set((state) => ({
          userTemplates: state.userTemplates.filter((t) => t.id !== id),
        })),
    }),
    {
      name: "aiwp-templates-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
      partialize: (state): TemplatesPersistedSlice => ({
        userTemplates: state.userTemplates,
      }),
    },
  ),
);
