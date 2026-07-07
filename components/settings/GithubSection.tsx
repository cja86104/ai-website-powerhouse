"use client";

/**
 * GithubSection — the legacy "GitHub Configuration" card (PAT path)
 * in the Settings panel. Coexists with the GitHub-App OAuth flow from
 * NEXT phase (W9) until PAT support is dropped in LATER+.
 *
 * Reads the username/token/enabled trio from the integrations store.
 * Credentials persist on change; the "Save" button flips the
 * `enabled` flag and shows the confirmation, matching legacy
 * semantics.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo, useCallback } from "react";
import { Github } from "lucide-react";
import { useIntegrationsStore } from "@/lib/store/integrations-store";

export const GithubSection = memo(function GithubSection() {
  const githubUsername = useIntegrationsStore((s) => s.githubUsername);
  const setGithubUsername = useIntegrationsStore((s) => s.setGithubUsername);
  const githubToken = useIntegrationsStore((s) => s.githubToken);
  const setGithubToken = useIntegrationsStore((s) => s.setGithubToken);
  const githubEnabled = useIntegrationsStore((s) => s.githubEnabled);
  const setGithubEnabled = useIntegrationsStore((s) => s.setGithubEnabled);

  const saveGithubSettings = useCallback(() => {
    if (githubUsername && githubToken) {
      setGithubEnabled(true);
      alert("GitHub settings saved!");
    } else {
      alert("Please fill in both GitHub username and token");
    }
  }, [githubUsername, githubToken, setGithubEnabled]);

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl p-6 border border-purple-500/20">
      <h3 className="text-xl font-bold text-purple-100 mb-4 flex items-center gap-2">
        <Github className="w-5 h-5" />
        GitHub Configuration
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            Username
          </label>
          <input
            type="text"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="your-username"
            className="w-full px-4 py-2 bg-[#1a1a2e] border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            Personal Access Token
          </label>
          <input
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            className="w-full px-4 py-2 bg-[#1a1a2e] border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <button
          onClick={saveGithubSettings}
          className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          {githubEnabled ? "Update Settings" : "Enable GitHub"}
        </button>
      </div>
    </div>
  );
});
