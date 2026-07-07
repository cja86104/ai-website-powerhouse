"use client";

/**
 * GithubPanel — the "GitHub Actions" modal (legacy PAT path). After
 * the W1 PR-5 cleanup it exposes exactly one action: Create New
 * Repository, which is a real GitHub REST call authenticated with the
 * user's PAT from the integrations store.
 *
 * W1 PR-5 dead-code deletion (Section 6 §7 item 3): the Clone
 * Repository and Push to GitHub sections were removed — both buttons
 * were `alert("... requires server-side implementation")` stubs. The
 * `cloneUrl`/`commitMessage` fields remain on the UI store, unused,
 * until the GitHub App OAuth flow ships the real implementations in
 * W9 (NEXT phase).
 *
 * Not part of the Section 6 §2 target file map — this panel is a
 * transitional survivor that W9 replaces wholesale, so it lives with
 * the other overlays in components/modals/.
 *
 * Reads `showGithubPanel` from the UI store; all hooks are declared
 * before the `if (!showGithubPanel) return null` guard — hooks-order
 * rule per Section 6 §6. No props.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-5.
 */

import { memo, useCallback } from "react";
import { GitBranch, Github, Loader2, X } from "lucide-react";
import { useIntegrationsStore } from "@/lib/store/integrations-store";
import { useUiStore } from "@/lib/store/ui-store";

export const GithubPanel = memo(function GithubPanel() {
  const showGithubPanel = useUiStore((s) => s.showGithubPanel);
  const setShowGithubPanel = useUiStore((s) => s.setShowGithubPanel);
  const isGithubProcessing = useUiStore((s) => s.isGithubProcessing);
  const setIsGithubProcessing = useUiStore((s) => s.setIsGithubProcessing);
  const repoName = useUiStore((s) => s.repoName);
  const setRepoName = useUiStore((s) => s.setRepoName);
  const repoDescription = useUiStore((s) => s.repoDescription);
  const setRepoDescription = useUiStore((s) => s.setRepoDescription);
  const githubToken = useIntegrationsStore((s) => s.githubToken);
  const githubEnabled = useIntegrationsStore((s) => s.githubEnabled);

  // Create a repository via the GitHub REST API using the legacy PAT.
  // Lifted verbatim from the legacy main component.
  const createGithubRepo = useCallback(async () => {
    if (!repoName || !githubEnabled) return;

    setIsGithubProcessing(true);
    try {
      const response = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: repoName,
          description: repoDescription,
          auto_init: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to create repository");

      const data = (await response.json()) as { html_url: string };
      alert(`Repository created: ${data.html_url}`);
      setRepoName("");
      setRepoDescription("");
    } catch (error) {
      console.error("GitHub error:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsGithubProcessing(false);
    }
  }, [
    repoName,
    repoDescription,
    githubToken,
    githubEnabled,
    setIsGithubProcessing,
    setRepoName,
    setRepoDescription,
  ]);

  if (!showGithubPanel) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-purple-500/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-purple-500/30 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-purple-100 flex items-center gap-2">
            <Github className="w-6 h-6" />
            GitHub Actions
          </h2>
          <button
            onClick={() => setShowGithubPanel(false)}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-purple-300" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!githubEnabled ? (
            <div className="text-center py-8">
              <Github className="w-16 h-16 text-purple-300 mx-auto mb-4 opacity-50" />
              <p className="text-purple-200 mb-4">
                GitHub integration is not enabled. Please configure your GitHub
                credentials in Settings.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Create Repository */}
              <div className="bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-bold text-purple-100 mb-4 flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Create New Repository
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Repository Name
                    </label>
                    <input
                      type="text"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      placeholder="my-awesome-website"
                      className="w-full px-4 py-2 bg-[#1a1a2e] border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={repoDescription}
                      onChange={(e) => setRepoDescription(e.target.value)}
                      placeholder="A beautiful website created with AI"
                      className="w-full px-4 py-2 bg-[#1a1a2e] border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <button
                    onClick={createGithubRepo}
                    disabled={isGithubProcessing || !repoName}
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGithubProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Repository...
                      </>
                    ) : (
                      "Create Repository"
                    )}
                  </button>
                </div>
              </div>

              {/* Clone Repository / Push to GitHub sections deleted in
                  W1 PR-5 — they were alert() stubs. Real clone/push
                  arrives with the GitHub App flow in W9. */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
