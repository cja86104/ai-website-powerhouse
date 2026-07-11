"use client";

/**
 * UsageChip — hosted-generation usage in the header (W9 Mon).
 *
 * Shows "N/limit hosted · window" colored by remaining headroom
 * (green < 80%, amber < 100%, red at the limit) with a month-to-date
 * breakdown in the native tooltip. Data comes from getUsageSummary,
 * which shares the entitlement rule with the quota gate — the chip
 * displays exactly what the gate will enforce.
 *
 * Fetches once per mount (a page visit); renders nothing while
 * loading, signed out, or on error — usage display must never break
 * the builder.
 */

import { memo, useEffect, useState } from "react";
import { Gauge } from "lucide-react";
import { getUsageSummary, type UsageSummary } from "@/lib/billing/usage";

export const UsageChip = memo(function UsageChip() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUsageSummary()
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch((error: unknown) => {
        console.error("Usage summary failed:", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (summary === null) return null;

  const ratio =
    summary.hostedLimit > 0 ? summary.hostedUsed / summary.hostedLimit : 0;
  const tone =
    ratio >= 1
      ? "bg-red-500/20 text-red-300 border-red-500/30"
      : ratio >= 0.8
        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
        : "bg-green-500/20 text-green-300 border-green-500/30";

  const monthTotal =
    summary.monthHosted + summary.monthByok + summary.monthOllama;
  const tooltip =
    `${summary.effectivePlan === "pro" ? "Pro" : "Free"} plan — hosted generations: ` +
    `${summary.hostedUsed}/${summary.hostedLimit} (${summary.windowLabel}).\n` +
    `This month: ${monthTotal} total — ${summary.monthHosted} hosted, ` +
    `${summary.monthByok} your key, ${summary.monthOllama} local Ollama.\n` +
    `Your own key and local Ollama are always unlimited.`;

  return (
    <span
      title={tooltip}
      className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium cursor-default ${tone}`}
    >
      <Gauge className="w-3.5 h-3.5" />
      {summary.hostedUsed}/{summary.hostedLimit} hosted · {summary.windowLabel}
    </span>
  );
});
