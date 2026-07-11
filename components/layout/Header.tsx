"use client";

/**
 * Header — top bar with the app title, the status ChipRow, and the
 * right-side action icons (GitHub panel toggle when GitHub is
 * enabled; Settings toggle always).
 *
 * Reads GitHub enablement from the integrations store and both
 * panel-visibility flags from the UI store. No props.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-3.
 * Account link added in W2 Fri (auth-gated app needs a sign-out path).
 * UsageChip added in W9 Mon (hosted-quota position at a glance).
 * The `AI Website Powerhouse` string literal is left in place —
 * product rename (if any) lands in W11 marketing work per Section 8.
 */

import { memo } from "react";
import Link from "next/link";
import { Github, LayoutGrid, Settings, User } from "lucide-react";
import { useIntegrationsStore } from "@/lib/store/integrations-store";
import { useUiStore } from "@/lib/store/ui-store";
import { ChipRow } from "@/components/layout/ChipRow";
import { UsageChip } from "@/components/layout/UsageChip";

export const Header = memo(function Header() {
  const githubEnabled = useIntegrationsStore((s) => s.githubEnabled);
  const showGithubPanel = useUiStore((s) => s.showGithubPanel);
  const setShowGithubPanel = useUiStore((s) => s.setShowGithubPanel);
  const showSettings = useUiStore((s) => s.showSettings);
  const setShowSettings = useUiStore((s) => s.setShowSettings);

  return (
    <header className="bg-gradient-to-r from-[#ff6b35]/20 to-[#f7931e]/20 backdrop-blur-sm border-b border-orange-500/20">
      <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff6b35] to-[#f7931e] bg-clip-text text-transparent">
            AI Website Powerhouse
          </h1>
          <ChipRow />
          <UsageChip />
        </div>
        <div className="flex items-center gap-2">
          {githubEnabled && (
            <button
              onClick={() => setShowGithubPanel(!showGithubPanel)}
              className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
              title="GitHub Actions"
            >
              <Github className="w-6 h-6 text-purple-300" />
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
          >
            <Settings className="w-6 h-6 text-orange-300" />
          </button>
          <Link
            href="/dashboard"
            className="p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
            title="My Projects"
          >
            <LayoutGrid className="w-6 h-6 text-orange-300" />
          </Link>
          <Link
            href="/account"
            className="p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
            title="Account"
          >
            <User className="w-6 h-6 text-orange-300" />
          </Link>
        </div>
      </div>
    </header>
  );
});
