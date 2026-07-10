"use client";

/**
 * DeployModal — "Deploy Your Website".
 *
 * Since W8 Tue-Thu this is a REAL one-click Vercel deploy (ADR-007):
 * the user saves a Vercel access token once (encrypted to their
 * account, never returned to the browser — see lib/deploy/vercel.ts),
 * then Deploy pushes the project's latest SAVED snapshot to their
 * Vercel account and polls the build until it is live. The manual
 * CLI/dashboard instructions from W1 remain below as the fallback
 * path (and the only path for Netlify until the fast-follow).
 *
 * Reads `showDeployModal` from the UI store; closes via
 * `setShowDeployModal(false)`. No props.
 *
 * HOOKS-ORDER RULE (FIX_LIST 1.1 bug class, Section 6 §6): every hook
 * below is declared BEFORE the `if (!showDeployModal) return null`
 * guard. Do not move any hook below that line.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Rocket, X } from "lucide-react";
import { useUiStore } from "@/lib/store/ui-store";
import { useGenerationStore } from "@/lib/store/generation-store";
import { hasVercelToken, saveVercelToken } from "@/lib/integrations/actions";
import {
  deployProjectToVercel,
  getVercelDeploymentStatus,
} from "@/lib/deploy/vercel";

type DeployTarget = "netlify" | "vercel";

type DeployPhase = "idle" | "starting" | "building" | "ready" | "error";

/** Poll cadence + budget: 3s x 60 = 3 minutes of build time. */
const POLL_INTERVAL_MS = 3000;
const POLL_LIMIT = 60;

export const DeployModal = memo(function DeployModal() {
  const showDeployModal = useUiStore((s) => s.showDeployModal);
  const setShowDeployModal = useUiStore((s) => s.setShowDeployModal);
  const projectId = useGenerationStore((s) => s.projectId);
  const generatedFiles = useGenerationStore((s) => s.generatedFiles);
  const [deployTarget, setDeployTarget] = useState<DeployTarget>("vercel");

  // One-click deploy state (W8).
  const [tokenSaved, setTokenSaved] = useState<boolean | null>(null);
  const [tokenDraft, setTokenDraft] = useState("");
  const [savingToken, setSavingToken] = useState(false);
  const [phase, setPhase] = useState<DeployPhase>("idle");
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  // Cancels the poll loop if the modal unmounts mid-build.
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    if (showDeployModal) {
      hasVercelToken()
        .then((saved) => setTokenSaved(saved))
        .catch(() => setTokenSaved(false));
    }
    return () => {
      cancelledRef.current = true;
    };
  }, [showDeployModal]);

  const handleSaveToken = useCallback(async () => {
    setSavingToken(true);
    try {
      await saveVercelToken(tokenDraft);
      setTokenSaved(tokenDraft.trim().length > 0);
      setTokenDraft("");
    } catch (error) {
      alert(
        `Could not save the token: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      setSavingToken(false);
    }
  }, [tokenDraft]);

  const handleDeploy = useCallback(async () => {
    if (projectId === null) return;
    setPhase("starting");
    setDeployError(null);
    setLiveUrl(null);
    try {
      const result = await deployProjectToVercel(projectId);
      if (cancelledRef.current) return;
      setPhase("building");
      for (let attempt = 0; attempt < POLL_LIMIT; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (cancelledRef.current) return;
        const status = await getVercelDeploymentStatus(result.deploymentId);
        if (cancelledRef.current) return;
        if (status.readyState === "READY") {
          setLiveUrl(status.url ?? result.url);
          setPhase("ready");
          return;
        }
        if (
          status.readyState === "ERROR" ||
          status.readyState === "CANCELED"
        ) {
          setDeployError(
            status.errorMessage ??
              "The build failed on Vercel. Open your Vercel dashboard for the build log.",
          );
          setPhase("error");
          return;
        }
      }
      setDeployError(
        "Timed out waiting for the build — it may still finish. Check your Vercel dashboard.",
      );
      setPhase("error");
    } catch (error) {
      if (cancelledRef.current) return;
      setDeployError(error instanceof Error ? error.message : String(error));
      setPhase("error");
    }
  }, [projectId]);

  const generateNetlifyInstructions = useCallback(() => {
    return `# Deploy to Netlify

## Option 1: Netlify CLI (Recommended)
1. Install Netlify CLI:
   npm install -g netlify-cli

2. Navigate to your project folder and run:
   netlify deploy

3. Follow the prompts:
   - Authorize Netlify (first time only)
   - Create new site or link existing
   - Deploy directory: ./ (current directory)

4. For production deployment:
   netlify deploy --prod

## Option 2: Netlify Drop
1. Go to https://app.netlify.com/drop
2. Drag and drop your ZIP file
3. Site will be live instantly!

## Option 3: Git Integration
1. Push your code to GitHub
2. Go to https://app.netlify.com
3. Click "Add new site" → "Import existing project"
4. Connect your GitHub repository
5. Configure:
   - Build command: (leave empty for static sites)
   - Publish directory: ./
6. Click "Deploy site"

Your site will auto-deploy on every git push!`;
  }, []);

  const generateVercelInstructions = useCallback(() => {
    return `# Deploy to Vercel manually

## Option 1: Vercel CLI
1. Install Vercel CLI:
   npm install -g vercel

2. Navigate to your project folder and run:
   vercel

3. Follow the prompts:
   - Login to Vercel (first time only)
   - Set up project settings
   - Deploy!

4. For production deployment:
   vercel --prod

## Option 2: Vercel Dashboard
1. Go to https://vercel.com/new
2. Click "Add GitHub Account" or import from Git
3. Select your repository
4. Configure:
   - Framework Preset: Vite (React projects) or Other (HTML)
   - Build Command: (auto for Vite; empty for static)
5. Click "Deploy"

Your site will be live with automatic HTTPS!`;
  }, []);

  const instructions = useMemo(
    () =>
      deployTarget === "netlify"
        ? generateNetlifyInstructions()
        : generateVercelInstructions(),
    [deployTarget, generateNetlifyInstructions, generateVercelInstructions],
  );

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(instructions);
    alert("Instructions copied to clipboard!");
  }, [instructions]);

  if (!showDeployModal) return null;

  const canDeploy =
    projectId !== null &&
    generatedFiles.length > 0 &&
    tokenSaved === true &&
    phase !== "starting" &&
    phase !== "building";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-purple-500/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-purple-500/30 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-purple-100">
            Deploy Your Website
          </h2>
          <button
            onClick={() => setShowDeployModal(false)}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-purple-300" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* One-click Vercel deploy (W8) */}
          <div className="bg-[#1a1a2e] rounded-lg p-4 border border-green-500/30">
            <h3 className="text-lg font-semibold text-green-200 mb-1 flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              One-click deploy to Vercel
            </h3>
            <p className="text-sm text-purple-300/70 mb-4">
              Deploys the latest saved version of this project to YOUR
              Vercel account. Free Vercel accounts work fine.
            </p>

            {tokenSaved === null && (
              <p className="flex items-center gap-2 text-sm text-purple-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking your Vercel connection…
              </p>
            )}

            {tokenSaved === false && (
              <div className="space-y-2">
                <p className="text-sm text-purple-200">
                  Connect Vercel once: create a token at{" "}
                  <a
                    href="https://vercel.com/account/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 underline"
                  >
                    vercel.com/account/tokens
                  </a>{" "}
                  and paste it here. It is stored encrypted and never
                  shown again.
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={tokenDraft}
                    onChange={(e) => setTokenDraft(e.target.value)}
                    placeholder="Vercel access token"
                    className="flex-1 px-3 py-2 bg-[#2d1b3d] border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500/50"
                  />
                  <button
                    onClick={() => void handleSaveToken()}
                    disabled={savingToken || tokenDraft.trim().length === 0}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg font-semibold disabled:opacity-50 transition-all"
                  >
                    {savingToken ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            )}

            {tokenSaved === true && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void handleDeploy()}
                    disabled={!canDeploy}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {phase === "starting" || phase === "building" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Rocket className="w-4 h-4" />
                    )}
                    {phase === "starting"
                      ? "Uploading…"
                      : phase === "building"
                        ? "Building on Vercel…"
                        : "Deploy to Vercel"}
                  </button>
                  <button
                    onClick={() => setTokenSaved(false)}
                    className="text-xs text-purple-300/60 hover:text-purple-200 underline"
                  >
                    Replace token
                  </button>
                </div>
                {generatedFiles.length === 0 && (
                  <p className="text-xs text-amber-300/80">
                    Generate a website first — there is nothing to deploy
                    yet.
                  </p>
                )}
                {phase === "ready" && liveUrl !== null && (
                  <p className="flex items-center gap-2 text-sm text-green-300">
                    <CheckCircle2 className="w-4 h-4" />
                    Live at{" "}
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline flex items-center gap-1"
                    >
                      {liveUrl.replace("https://", "")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                )}
                {phase === "error" && deployError !== null && (
                  <p className="text-sm text-red-300">{deployError}</p>
                )}
              </div>
            )}
          </div>

          {/* Manual instructions (W1) */}
          <div>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setDeployTarget("vercel")}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  deployTarget === "vercel"
                    ? "bg-gradient-to-r from-black to-gray-800 text-white shadow-lg"
                    : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                }`}
              >
                Vercel (manual)
              </button>
              <button
                onClick={() => setDeployTarget("netlify")}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  deployTarget === "netlify"
                    ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg"
                    : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                }`}
              >
                Netlify
              </button>
            </div>

            <div className="bg-[#1a1a2e] rounded-lg p-4 border border-purple-500/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-purple-200">
                  Manual Deployment Instructions
                </h3>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="text-sm text-purple-100 whitespace-pre-wrap font-mono overflow-x-auto">
                {instructions}
              </pre>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-purple-500/30 bg-purple-500/5">
          <p className="text-sm text-purple-300">
            💡 <strong>Tip:</strong> One-click deploy uses the last SAVED
            version of your project. If you just made a change, wait for
            the save confirmation before deploying.
          </p>
        </div>
      </div>
    </div>
  );
});
