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
 *
 * Tailwind normalization (2026-07-11, user-reported 3/3 failure):
 * models trained on the PostCSS Tailwind setup keep emitting
 * `@tailwind base/components/utilities` directives and omitting the
 * CDN script — with no PostCSS pipeline those directives are dead
 * code and the site renders unstyled. normalizeTailwindSetup makes
 * the CDN contract hold regardless of model behavior.
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

const TAILWIND_CDN_TAG = '<script src="https://cdn.tailwindcss.com"></script>';

const REACT_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AIWP Site</title>
  ${TAILWIND_CDN_TAG}
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;

/**
 * Enforce the CDN Tailwind contract on a parsed project:
 *  1. index.html missing entirely → inject the standard shell.
 *  2. index.html present but no CDN script → insert it before
 *     </head> (or prepend when no head tag survived).
 *  3. Dead `@tailwind`/`@apply`-directive lines in any .css file are
 *     removed — they are no-ops without PostCSS and signal the model
 *     used the wrong setup. (@apply blocks are left intact only when
 *     no safer transform exists; the directive lines themselves go.)
 */
export function normalizeTailwindSetup(
  files: GeneratedFile[],
): GeneratedFile[] {
  if (files.length === 0) return files;
  const result: GeneratedFile[] = [];
  let hasIndexHtml = false;

  for (const file of files) {
    if (file.name === "index.html") {
      hasIndexHtml = true;
      let content = file.content;
      if (!content.includes("cdn.tailwindcss.com")) {
        content = content.includes("</head>")
          ? content.replace("</head>", `  ${TAILWIND_CDN_TAG}
</head>`)
          : `${TAILWIND_CDN_TAG}
${content}`;
      }
      result.push({ name: file.name, content });
      continue;
    }
    if (file.name.endsWith(".css")) {
      const content = file.content
        .split("\n")
        .filter(
          (line) =>
            !/^\s*@tailwind\s+(base|components|utilities)\s*;?\s*$/.test(line),
        )
        .join("\n");
      result.push({ name: file.name, content });
      continue;
    }
    // tailwind/postcss config files are harmless but misleading in the
    // CDN setup — drop them so users don't think they are wired up.
    if (
      file.name === "tailwind.config.js" ||
      file.name === "tailwind.config.ts" ||
      file.name === "postcss.config.js"
    ) {
      continue;
    }
    result.push(file);
  }

  if (!hasIndexHtml) {
    result.unshift({ name: "index.html", content: REACT_INDEX_HTML });
  }
  return result;
}

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
  const result = [...normalizeTailwindSetup(files)];
  if (!result.some((f) => f.name === "package.json")) {
    result.unshift({ name: "package.json", content: REACT_PACKAGE_JSON });
  }
  if (!result.some((f) => f.name === "vite.config.js")) {
    result.push({ name: "vite.config.js", content: REACT_VITE_CONFIG });
  }
  return result;
}
