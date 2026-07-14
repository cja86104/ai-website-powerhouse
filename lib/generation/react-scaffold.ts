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
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.553.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0"
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

/**
 * Missing local-import backstop (2026-07-14, user-reported: "Failed to
 * resolve import './pages/NotFound.jsx'" on first generation).
 *
 * The forbidden-package validator (import-validator.ts) only checks npm
 * specifiers and deliberately skips relative imports, on the assumption
 * that a model's own local files always exist. They don't always: on
 * larger multi-page generations the model sometimes references a page
 * or component (e.g. a lazy-loaded 404 route) that it never actually
 * emitted. Sandpack's in-browser bundler then throws an unrecoverable
 * "Failed to resolve import" error before React ever mounts — worse
 * than the forbidden-package case, where the rest of the app still
 * rendered. This scans every relative/root-relative import in the
 * parsed project and, for any target that isn't present, injects a
 * minimal placeholder component at that exact path so the bundler
 * never sees a dangling import. Model-emitted files are never touched
 * or overwritten; this only fills gaps.
 *
 * A case-insensitive match is treated as resolved and left alone
 * (skipped, not stubbed) — that's a casing bug, not a missing file,
 * and injecting a blank stub there would shadow real authored content
 * instead of fixing anything.
 */

const JS_LIKE_EXTENSIONS = [".jsx", ".js", ".tsx", ".ts"];

/** import/export ... from "x" | require("x") | import("x") */
const RELATIVE_IMPORT_PATTERNS = [
  /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*["']([^"']+)["']/g,
  /(?:^|\n)\s*import\s*["']([^"']+)["']/g,
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
];

function normalizeSegments(parts: string[]): string {
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return stack.join("/");
}

/** Resolves a relative or root-relative specifier against the importing file's path. */
function resolveLocalTarget(fromFile: string, specifier: string): string {
  if (specifier.startsWith("/")) {
    return normalizeSegments(specifier.slice(1).split("/"));
  }
  const fromDir = fromFile.includes("/")
    ? fromFile.slice(0, fromFile.lastIndexOf("/"))
    : "";
  const combined = (fromDir ? fromDir.split("/") : []).concat(
    specifier.split("/"),
  );
  return normalizeSegments(combined);
}

/**
 * Candidate file paths a resolved base could refer to. Returns an
 * empty array when the base clearly isn't a JS/JSX module (a known
 * asset extension, or some other unrecognized extension) — those are
 * a different failure class and out of scope here.
 */
function candidatePaths(basePath: string): string[] {
  const extMatch = /\.[A-Za-z0-9]+$/.exec(basePath);
  if (extMatch) {
    return JS_LIKE_EXTENSIONS.includes(extMatch[0].toLowerCase())
      ? [basePath]
      : [];
  }
  const withExt = JS_LIKE_EXTENSIONS.map((ext) => `${basePath}${ext}`);
  const withIndex = JS_LIKE_EXTENSIONS.map(
    (ext) => `${basePath}/index${ext}`,
  );
  return [...withExt, ...withIndex];
}

function componentNameFromPath(path: string): string {
  const base = path.split("/").pop() ?? "Component";
  const withoutExt = base.replace(/\.(jsx|js|tsx|ts)$/, "");
  let name = withoutExt.replace(/[^A-Za-z0-9_$]/g, "");
  if (name === "") name = "GeneratedPlaceholder";
  if (/^[0-9]/.test(name)) name = `Page${name}`;
  return name;
}

function placeholderComponent(name: string): string {
  return `export default function ${name}() {
  return (
    <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>This section isn&apos;t built yet</h2>
        <p style={{ opacity: 0.7, maxWidth: '32rem', margin: '0 auto' }}>
          The site referenced this page but didn&apos;t generate its content. Ask for it by name and it&apos;ll be filled in.
        </p>
      </div>
    </div>
  )
}
`;
}

export interface LocalImportBackstopResult {
  files: GeneratedFile[];
  /** Paths of placeholder files that were injected, in injection order. */
  injectedPaths: string[];
}

/**
 * Ensures every relative/root-relative import in a parsed React
 * project resolves to a file in the set. Missing targets get a safe
 * placeholder component injected at the exact resolved path. No-op
 * (byte-identical) when everything already resolves or when the input
 * is empty.
 */
export function ensureLocalImportsResolve(
  files: GeneratedFile[],
): LocalImportBackstopResult {
  if (files.length === 0) return { files, injectedPaths: [] };

  const byName = new Set(files.map((f) => f.name));
  const byLowerName = new Set(files.map((f) => f.name.toLowerCase()));
  const injected = new Map<string, GeneratedFile>();

  for (const file of files) {
    if (!/\.(jsx|js)$/.test(file.name)) continue;
    if (/(^|\/)(vite|tailwind|postcss)\.config\.(js|ts|mjs)$/.test(file.name)) {
      continue;
    }

    for (const pattern of RELATIVE_IMPORT_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(file.content)) !== null) {
        const specifier = match[1];
        if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
          continue; // npm package — import-validator's job, not ours
        }

        const basePath = resolveLocalTarget(file.name, specifier);
        if (basePath === "") continue;

        const candidates = candidatePaths(basePath);
        if (candidates.length === 0) continue; // asset or unknown extension

        if (candidates.some((c) => byName.has(c))) continue; // resolves fine

        const caseInsensitiveHit = candidates.some((c) =>
          byLowerName.has(c.toLowerCase()),
        );
        if (caseInsensitiveHit) continue; // casing bug, not a missing file

        const stubPath = candidates[0];
        if (injected.has(stubPath) || byName.has(stubPath)) continue;

        injected.set(stubPath, {
          name: stubPath,
          content: placeholderComponent(componentNameFromPath(stubPath)),
        });
      }
    }
  }

  if (injected.size === 0) {
    return { files, injectedPaths: [] };
  }
  return {
    files: [...files, ...injected.values()],
    injectedPaths: [...injected.keys()],
  };
}

/**
 * Plain-language chat note for a non-technical user when a placeholder
 * was injected. Returns null when nothing was injected.
 */
export function localImportStubNote(injectedPaths: string[]): string | null {
  if (injectedPaths.length === 0) return null;
  const plural = injectedPaths.length > 1;
  const list = injectedPaths.map((p) => `"${p}"`).join(", ");
  return (
    `Heads up: the site referenced ${plural ? "some pages" : "a page"} ` +
    `(${list}) that ${plural ? "weren't" : "wasn't"} actually generated, ` +
    "so I added a simple placeholder to keep the preview working. " +
    "Ask me to build out that page and I'll fill it in."
  );
}
