"use client";

/**
 * SupabaseConnectSection — "Connect your Supabase" (2026-07-31).
 *
 * Design: PLAN/Feature-Connect-Your-Supabase.md. Replaces the retired
 * `SupabaseSection.tsx` (legacy pre-refactor card that saved a URL/key
 * pair nobody read — confirmed by grep, zero wiring into any prompt
 * builder or generation path).
 *
 * PROJECT-scoped, not account-scoped — the first project-scoped secret
 * in the app; every other encrypted credential (OpenRouter key, Vercel
 * token) lives on `user_integrations` keyed by user_id. This one lives
 * on `projects` (migration 0008) because different projects can target
 * different Supabase backends. Reads the open project id from
 * `generation-store` the same way `SandpackReactPreview`/`DeployModal`
 * do — no props.
 *
 * Loads on open the same way `DeployModal` loads `hasVercelToken()`:
 * tri-state (`undefined` = loading, `null` = not connected, object =
 * connected), keyed on `projectId` so switching projects while
 * Settings happens to be open re-loads instead of showing stale state.
 *
 * On successful save/clear, also flips `generation-store`'s
 * `supabaseConnected` flag so `ChipRow`/`SystemStatusList` update
 * immediately without needing a full workspace reload.
 */

import { memo, useCallback, useEffect, useState } from "react";
import { Database, Loader2 } from "lucide-react";
import { useGenerationStore } from "@/lib/store/generation-store";
import {
  saveSupabaseConnection,
  clearSupabaseConnection,
  loadSupabaseConnection,
  type SupabaseConnection,
} from "@/lib/supabase-connect/actions";

export const SupabaseConnectSection = memo(function SupabaseConnectSection() {
  const projectId = useGenerationStore((s) => s.projectId);
  const setSupabaseConnected = useGenerationStore(
    (s) => s.setSupabaseConnected,
  );

  // undefined = loading, null = not connected, object = connected.
  const [connection, setConnection] = useState<
    SupabaseConnection | null | undefined
  >(undefined);
  const [urlDraft, setUrlDraft] = useState("");
  const [keyDraft, setKeyDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (projectId === null) {
      setConnection(null);
      setUrlDraft("");
      setKeyDraft("");
      return;
    }
    setConnection(undefined);
    let cancelled = false;
    loadSupabaseConnection(projectId)
      .then((loaded) => {
        if (cancelled) return;
        setConnection(loaded);
        setUrlDraft(loaded?.url ?? "");
        setKeyDraft(loaded?.anonKey ?? "");
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        console.error("Supabase connection load failed:", loadError);
        setConnection(null);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handleSave = useCallback(async () => {
    if (projectId === null) return;
    setSaving(true);
    setError(null);
    try {
      await saveSupabaseConnection(projectId, urlDraft, keyDraft);
      const reloaded = await loadSupabaseConnection(projectId);
      setConnection(reloaded);
      setSupabaseConnected(reloaded !== null);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : String(saveError),
      );
    } finally {
      setSaving(false);
    }
  }, [projectId, urlDraft, keyDraft, setSupabaseConnected]);

  const handleClear = useCallback(async () => {
    if (projectId === null) return;
    setClearing(true);
    setError(null);
    try {
      await clearSupabaseConnection(projectId);
      setConnection(null);
      setUrlDraft("");
      setKeyDraft("");
      setSupabaseConnected(false);
    } catch (clearError) {
      setError(
        clearError instanceof Error ? clearError.message : String(clearError),
      );
    } finally {
      setClearing(false);
    }
  }, [projectId, setSupabaseConnected]);

  const isConnected = connection !== null && connection !== undefined;
  const isLoading = connection === undefined && projectId !== null;

  return (
    <div className="bg-gradient-to-br from-green-500/10 to-transparent rounded-xl p-6 border border-green-500/20">
      <h3 className="text-xl font-bold text-green-100 mb-4 flex items-center gap-2">
        <Database className="w-5 h-5" />
        Connect Your Supabase
      </h3>

      {projectId === null ? (
        <p className="text-sm text-green-300/70">
          Open a project to connect a Supabase backend to it.
        </p>
      ) : isLoading ? (
        <p className="flex items-center gap-2 text-sm text-green-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking your Supabase connection…
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-green-300/70">
            Paste your own Supabase project&apos;s URL and anon key so
            generated code can read/write real data instead of mock data.
            AIWP never runs SQL against your project — it generates a{" "}
            <code className="text-green-200">schema.sql</code> file for you
            to run yourself.
          </p>
          <div>
            <label className="block text-sm font-medium text-green-200 mb-2">
              Project URL
            </label>
            <input
              type="text"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full px-4 py-2 bg-[#1a1a2e] border border-green-500/30 rounded-lg text-green-100 placeholder-green-400/50 focus:outline-none focus:border-green-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-green-200 mb-2">
              Anon Key
            </label>
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="w-full px-4 py-2 bg-[#1a1a2e] border border-green-500/30 rounded-lg text-green-100 placeholder-green-400/50 focus:outline-none focus:border-green-500/50"
            />
          </div>
          {error !== null && <p className="text-sm text-red-300">{error}</p>}
          <p className="text-xs text-green-300/60">
            {isConnected
              ? "Connected — generated code will use your Supabase project."
              : "Not connected — data will be mocked/local until you connect one."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => void handleSave()}
              disabled={
                saving || urlDraft.trim().length === 0 || keyDraft.trim().length === 0
              }
              className="flex-1 py-2 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : isConnected
                  ? "Update Connection"
                  : "Save Connection"}
            </button>
            {isConnected && (
              <button
                onClick={() => void handleClear()}
                disabled={clearing}
                className="px-4 py-2 bg-transparent border border-green-500/30 text-green-300 rounded-lg font-semibold hover:bg-green-500/10 transition-all disabled:opacity-50"
              >
                {clearing ? "Disconnecting…" : "Disconnect"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
