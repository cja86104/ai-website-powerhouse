"use client";

/**
 * DeployModal — the "Deploy Your Website" modal with Netlify/Vercel
 * instruction tabs and a copy-to-clipboard action. Static instructions
 * only in W1; the real Vercel API deploy flow lands in W8 (NEXT).
 *
 * Reads `showDeployModal` from the UI store; closes via
 * `setShowDeployModal(false)`. No props.
 *
 * HOOKS-ORDER RULE (FIX_LIST 1.1 bug class, Section 6 §6): every hook
 * below — the two store selectors, `deployTarget` state, the two
 * instruction builders, the `instructions` memo, and
 * `copyToClipboard` — is declared BEFORE the
 * `if (!showDeployModal) return null` guard. Do not move any hook
 * below that line.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo, useCallback, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useUiStore } from "@/lib/store/ui-store";

type DeployTarget = "netlify" | "vercel";

export const DeployModal = memo(function DeployModal() {
  const showDeployModal = useUiStore((s) => s.showDeployModal);
  const setShowDeployModal = useUiStore((s) => s.setShowDeployModal);
  const [deployTarget, setDeployTarget] = useState<DeployTarget>("netlify");

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
    return `# Deploy to Vercel

## Option 1: Vercel CLI (Recommended)
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
   - Framework Preset: Other
   - Build Command: (leave empty for static)
   - Output Directory: ./
5. Click "Deploy"

## Option 3: Drag & Drop
1. Download your project as ZIP
2. Go to https://vercel.com/new
3. Click "Deploy" tab
4. Drag and drop your project folder
5. Click "Upload"

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

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex gap-3 mb-6">
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
            <button
              onClick={() => setDeployTarget("vercel")}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                deployTarget === "vercel"
                  ? "bg-gradient-to-r from-black to-gray-800 text-white shadow-lg"
                  : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
              }`}
            >
              Vercel
            </button>
          </div>

          <div className="bg-[#1a1a2e] rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-purple-200">
                Deployment Instructions
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

        <div className="p-6 border-t border-purple-500/30 bg-purple-500/5">
          <p className="text-sm text-purple-300">
            💡 <strong>Tip:</strong> For the fastest deployment, use the
            drag-and-drop options. Download your files as ZIP and upload to{" "}
            {deployTarget === "netlify" ? "Netlify Drop" : "Vercel"}.
          </p>
        </div>
      </div>
    </div>
  );
});
