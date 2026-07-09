/**
 * AI Website Powerhouse — React project scaffold backstop (W5 Fri fix).
 *
 * First real-world W5 test: the model produced a perfect project but
 * skipped package.json — it saw the complete file as a worked example
 * in the system prompt and treated "shown" as "provided". Since the
 * prompt PINS these two files to exact contents (no extra deps
 * allowed), the app can inject them deterministically whenever a
 * model forgets. A user's ZIP must always be `npm install && npm run
 * dev` runnable.
 *
 * Kept byte-identical to the templates in react-system-prompt.ts —
 * update both together.
 */

import type { GeneratedFile } from "@/lib/generation/types";

const REACT_PACKAGE_JSON = `{
  "name": "aiwp-site",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0"
  }
}`;

const REACT_VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;

/**
 * Ensure the fixed scaffold files exist in a parsed React project.
 * Model-emitted versions are kept (never overwritten); only missing
 * ones are injected. No-op for empty input (a failed parse should
 * stay visibly failed, not become a phantom two-file project).
 */
export function ensureReactScaffold(
  files: GeneratedFile[],
): GeneratedFile[] {
  if (files.length === 0) return files;
  const result = [...files];
  if (!result.some((f) => f.name === "package.json")) {
    result.unshift({ name: "package.json", content: REACT_PACKAGE_JSON });
  }
  if (!result.some((f) => f.name === "vite.config.js")) {
    result.push({ name: "vite.config.js", content: REACT_VITE_CONFIG });
  }
  return result;
}
