/**
 * AI Website Powerhouse — legacy-localStorage migration.
 *
 * Runs once per browser on first mount of the refactored app. Reads
 * any legacy keys still present in `localStorage`, rewrites their
 * values into the Zustand-persist JSON shape under the new versioned
 * keys, then deletes the legacy keys.
 *
 * Idempotent via the `aiwp-migrated-v1` flag — subsequent mounts
 * short-circuit immediately.
 *
 * Must run BEFORE any persisted Zustand store is rehydrated, so the
 * rehydrate step finds the migrated values. The `<HydrationGate>`
 * wrapper enforces this order.
 *
 * Key mapping (per Section 6 §4.1, plus the missed-from-inventory
 * `aiwebsite_user_templates` → `aiwp-templates-v1`):
 *
 *   ollamaUrl                   → aiwp-settings-v1
 *   aiProvider                  → aiwp-settings-v1
 *   openrouterKey               → aiwp-settings-v1
 *   openrouterModel             → aiwp-settings-v1
 *   openrouterCustomSlug        → aiwp-settings-v1
 *   openrouterMaxTokens         → aiwp-settings-v1 (parsed to number)
 *   supabaseUrl                 → aiwp-integrations-v1
 *   supabaseKey                 → aiwp-integrations-v1 (+ enabled=true)
 *   githubUsername              → aiwp-integrations-v1
 *   githubToken                 → aiwp-integrations-v1 (+ enabled=true)
 *   aiwebsite_user_templates    → aiwp-templates-v1
 *   aiwebsite_autosave          → aiwp-autosave-v1 (shape unchanged)
 */

import type { AiProvider } from "@/lib/store/settings-store";
import type { UserTemplate } from "@/lib/store/templates-store";

const MIGRATION_FLAG_KEY = "aiwp-migrated-v1";

/** Versioned-persist envelope that matches Zustand's `persist` storage shape. */
interface PersistEnvelope<T> {
  state: T;
  version: number;
}

interface SettingsPersistedSlice {
  aiProvider?: AiProvider;
  ollamaUrl?: string;
  openrouterKey?: string;
  openrouterModel?: string;
  openrouterCustomSlug?: string;
  openrouterMaxTokens?: number;
}

interface IntegrationsPersistedSlice {
  supabaseUrl?: string;
  supabaseKey?: string;
  supabaseEnabled?: boolean;
  githubUsername?: string;
  githubToken?: string;
  githubEnabled?: boolean;
}

interface TemplatesPersistedSlice {
  userTemplates?: UserTemplate[];
}

/** True iff the value is a non-empty string. */
function nonEmpty(value: string | null): value is string {
  return value !== null && value !== "";
}

/**
 * Migrate legacy localStorage keys to the new versioned format.
 *
 * @returns `true` if migration ran this call, `false` if it was already
 *   complete or running outside a browser.
 */
export function migrateLegacyLocalStorage(): boolean {
  if (typeof window === "undefined") return false;

  let storage: Storage;
  try {
    storage = window.localStorage;
  } catch {
    return false;
  }

  if (storage.getItem(MIGRATION_FLAG_KEY) === "true") return false;

  // --- Settings ---------------------------------------------------------
  const settings: SettingsPersistedSlice = {};

  const legacyOllamaUrl = storage.getItem("ollamaUrl");
  if (nonEmpty(legacyOllamaUrl)) settings.ollamaUrl = legacyOllamaUrl;

  const legacyProvider = storage.getItem("aiProvider");
  if (legacyProvider === "openrouter" || legacyProvider === "ollama") {
    settings.aiProvider = legacyProvider;
  }

  const legacyOrKey = storage.getItem("openrouterKey");
  if (nonEmpty(legacyOrKey)) settings.openrouterKey = legacyOrKey;

  const legacyOrModel = storage.getItem("openrouterModel");
  if (nonEmpty(legacyOrModel)) settings.openrouterModel = legacyOrModel;

  const legacyOrCustom = storage.getItem("openrouterCustomSlug");
  if (nonEmpty(legacyOrCustom)) settings.openrouterCustomSlug = legacyOrCustom;

  const legacyOrMaxTokens = storage.getItem("openrouterMaxTokens");
  if (nonEmpty(legacyOrMaxTokens)) {
    const parsed = parseInt(legacyOrMaxTokens, 10);
    if (!isNaN(parsed) && parsed > 0) settings.openrouterMaxTokens = parsed;
  }

  if (Object.keys(settings).length > 0) {
    const envelope: PersistEnvelope<SettingsPersistedSlice> = {
      state: settings,
      version: 1,
    };
    storage.setItem("aiwp-settings-v1", JSON.stringify(envelope));
  }

  // --- Integrations -----------------------------------------------------
  const integrations: IntegrationsPersistedSlice = {};

  const legacySupabaseUrl = storage.getItem("supabaseUrl");
  if (nonEmpty(legacySupabaseUrl)) integrations.supabaseUrl = legacySupabaseUrl;

  const legacySupabaseKey = storage.getItem("supabaseKey");
  if (nonEmpty(legacySupabaseKey)) {
    integrations.supabaseKey = legacySupabaseKey;
    integrations.supabaseEnabled = true;
  }

  const legacyGithubUsername = storage.getItem("githubUsername");
  if (nonEmpty(legacyGithubUsername))
    integrations.githubUsername = legacyGithubUsername;

  const legacyGithubToken = storage.getItem("githubToken");
  if (nonEmpty(legacyGithubToken)) {
    integrations.githubToken = legacyGithubToken;
    integrations.githubEnabled = true;
  }

  if (Object.keys(integrations).length > 0) {
    const envelope: PersistEnvelope<IntegrationsPersistedSlice> = {
      state: integrations,
      version: 1,
    };
    storage.setItem("aiwp-integrations-v1", JSON.stringify(envelope));
  }

  // --- Templates --------------------------------------------------------
  const legacyTemplates = storage.getItem("aiwebsite_user_templates");
  if (nonEmpty(legacyTemplates)) {
    try {
      const parsed = JSON.parse(legacyTemplates) as unknown;
      if (Array.isArray(parsed)) {
        const envelope: PersistEnvelope<TemplatesPersistedSlice> = {
          state: { userTemplates: parsed as UserTemplate[] },
          version: 1,
        };
        storage.setItem("aiwp-templates-v1", JSON.stringify(envelope));
      }
    } catch {
      // Malformed legacy payload — fall through, user loses templates.
      // Matches the legacy behavior which silently ignored bad JSON.
    }
  }

  // --- Autosave snapshot (shape unchanged, key renamed) -----------------
  const legacyAutosave = storage.getItem("aiwebsite_autosave");
  if (nonEmpty(legacyAutosave)) {
    storage.setItem("aiwp-autosave-v1", legacyAutosave);
  }

  // --- Delete legacy keys ----------------------------------------------
  const legacyKeys = [
    "ollamaUrl",
    "supabaseUrl",
    "supabaseKey",
    "githubUsername",
    "githubToken",
    "aiProvider",
    "openrouterKey",
    "openrouterModel",
    "openrouterCustomSlug",
    "openrouterMaxTokens",
    "aiwebsite_user_templates",
    "aiwebsite_autosave",
  ];
  for (const key of legacyKeys) storage.removeItem(key);

  storage.setItem(MIGRATION_FLAG_KEY, "true");
  return true;
}
