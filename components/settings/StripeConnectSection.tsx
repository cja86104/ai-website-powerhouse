"use client";

/**
 * StripeConnectSection — "Connect Your Stripe" (2026-08-01).
 *
 * Mirrors components/settings/SupabaseConnectSection.tsx exactly: same
 * tri-state load (`undefined` = loading, `null` = not connected, object
 * = connected) keyed on `projectId`, same save/clear/error flow, same
 * live flip of a generation-store flag so ChipRow/SystemStatusList
 * update without a full workspace reload.
 *
 * PROJECT-scoped, not account-scoped, for the same reason as Supabase:
 * different projects can sell different things through different
 * Stripe accounts.
 *
 * Only ever collects a PUBLISHABLE key — see lib/stripe-connect/actions.ts
 * for the safety boundary. The copy below is explicit that this wires a
 * real checkout UI, not a complete payment backend, so users aren't
 * surprised when a test submission doesn't actually charge a card.
 */

import { memo, useCallback, useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { useGenerationStore } from "@/lib/store/generation-store";
import {
  saveStripeConnection,
  clearStripeConnection,
  loadStripeConnection,
  type StripeConnection,
} from "@/lib/stripe-connect/actions";

export const StripeConnectSection = memo(function StripeConnectSection() {
  const projectId = useGenerationStore((s) => s.projectId);
  const setStripeConnected = useGenerationStore((s) => s.setStripeConnected);

  // undefined = loading, null = not connected, object = connected.
  const [connection, setConnection] = useState<
    StripeConnection | null | undefined
  >(undefined);
  const [keyDraft, setKeyDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (projectId === null) {
      setConnection(null);
      setKeyDraft("");
      return;
    }
    setConnection(undefined);
    let cancelled = false;
    loadStripeConnection(projectId)
      .then((loaded) => {
        if (cancelled) return;
        setConnection(loaded);
        setKeyDraft(loaded?.publishableKey ?? "");
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        console.error("Stripe connection load failed:", loadError);
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
      await saveStripeConnection(projectId, keyDraft);
      const reloaded = await loadStripeConnection(projectId);
      setConnection(reloaded);
      setStripeConnected(reloaded !== null);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : String(saveError),
      );
    } finally {
      setSaving(false);
    }
  }, [projectId, keyDraft, setStripeConnected]);

  const handleClear = useCallback(async () => {
    if (projectId === null) return;
    setClearing(true);
    setError(null);
    try {
      await clearStripeConnection(projectId);
      setConnection(null);
      setKeyDraft("");
      setStripeConnected(false);
    } catch (clearError) {
      setError(
        clearError instanceof Error ? clearError.message : String(clearError),
      );
    } finally {
      setClearing(false);
    }
  }, [projectId, setStripeConnected]);

  const isConnected = connection !== null && connection !== undefined;
  const isLoading = connection === undefined && projectId !== null;

  return (
    <div className="bg-gradient-to-br from-green-500/10 to-transparent rounded-xl p-6 border border-green-500/20">
      <h3 className="text-xl font-bold text-green-100 mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5" />
        Connect Your Stripe
      </h3>

      {projectId === null ? (
        <p className="text-sm text-green-300/70">
          Open a project to connect a Stripe account to it.
        </p>
      ) : isLoading ? (
        <p className="flex items-center gap-2 text-sm text-green-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking your Stripe connection…
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-green-300/70">
            Paste your Stripe{" "}
            <strong className="text-green-200">publishable</strong> key so
            generated code can build a real checkout UI. AIWP never asks
            for your secret key, and can&apos;t complete an actual charge
            on its own — generated code will need a backend endpoint
            (which you provide) to create the payment before a card can
            be charged.
          </p>
          <div>
            <label className="block text-sm font-medium text-green-200 mb-2">
              Publishable Key
            </label>
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="pk_test_51AbCdEf..."
              className="w-full px-4 py-2 bg-[#1a1a2e] border border-green-500/30 rounded-lg text-green-100 placeholder-green-400/50 focus:outline-none focus:border-green-500/50"
            />
          </div>
          {error !== null && <p className="text-sm text-red-300">{error}</p>}
          <p className="text-xs text-green-300/60">
            {isConnected
              ? "Connected — generated code will build a real Stripe checkout UI against this key."
              : "Not connected — checkout UI will be mocked/local until you connect a Stripe account."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => void handleSave()}
              disabled={saving || keyDraft.trim().length === 0}
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
