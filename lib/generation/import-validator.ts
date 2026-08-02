/**
 * Forbidden-import detector (2026-07-12, user-reported).
 *
 * The React prompt contract pins the dependency set to react +
 * react-dom, but models still occasionally import packages from
 * habit (the reported case: `import { Link } from "react-scroll"`),
 * which kills the preview with a vite import-analysis overlay that
 * non-technical users can't read. This scans parsed project files at
 * generation time so the Builder can put a plain-language recovery
 * message in the chat BEFORE the user meets the red overlay.
 *
 * Detection only — automatic rewriting of model output would risk
 * breaking working code; the fix request itself is one chat round,
 * which the reporting user confirmed works ("it fixed it
 * immediately").
 */

import type { GeneratedFile } from "@/lib/generation/types";

/**
 * Packages the pinned scaffold actually provides (2026-07-12 user
 * decision: quality pack whitelisted — framer-motion, lucide-react,
 * react-router-dom). react-router is react-router-dom's transitive
 * dependency; models occasionally import from it directly and it
 * resolves fine, so it must not trip a false warning.
 *
 * Expanded 2026-07-31 (user request: app-builder whitelist) — data
 * fetching/caching, client state, forms/validation, dates, markdown,
 * charts, and drag-and-drop. Each addition is mirrored in
 * react-scaffold.ts's REACT_PACKAGE_JSON, react-system-prompt.ts's
 * package.json template + IMPORT WHITELIST prose, react-modify-prompt.ts
 * and scoped-modify-prompt.ts's inline allow-lists, and
 * SandpackReactPreview.tsx's customSetup.dependencies — update all six
 * together. @hookform/resolvers is the react-hook-form <-> zod bridge
 * (zodResolver); without it models reach for it anyway once both
 * packages are available, so it ships alongside them rather than
 * tripping a false warning on the very next round.
 *
 * "@supabase/supabase-js" (2026-07-31, Connect Your Supabase item 3) is
 * DIFFERENT from every package above: those are self-contained and safe
 * for every project. This one is only USEFUL, and only meant to be
 * used, when a project has a real Supabase connection — see the
 * SUPABASE BACKEND CONNECTED block in lib/prompts/supabase-block.ts and
 * the IMPORT WHITELIST guidance in react-system-prompt.ts, both of
 * which tell the model NOT to import it when disconnected. It is still
 * always in this allowlist (unconditionally, like the others) so a
 * correctly-connected generation never trips a false "forbidden
 * import" warning; the real safety mechanism is that
 * lib/generation/supabase-scaffold.ts only ever writes REAL credentials
 * into src/lib/supabase.ts, and only when a connection actually exists
 * — never a placeholder. Also NOT in react-scaffold.ts's default
 * package.json or SandpackReactPreview.tsx's ALWAYS-on dependencies
 * (unlike the packages above) — it's added to the Sandpack preview
 * conditionally, only for connected projects, so disconnected projects
 * never pay for fetching/bundling an unused package.
 *
 * "@stripe/stripe-js" and "@stripe/react-stripe-js" (2026-08-01, Connect
 * Your Stripe item 3) are the same category as "@supabase/supabase-js"
 * above — only useful, and only meant to be used, when a project has a
 * real Stripe connection (see the STRIPE PAYMENTS CONNECTED block in
 * lib/prompts/stripe-block.ts). Both ship together, same reasoning as
 * @hookform/resolvers riding along with react-hook-form+zod:
 * react-stripe-js (the <Elements>/<PaymentElement>/useStripe hooks) is
 * what makes stripe-js's loadStripe() actually usable from React, so a
 * model reaching for one reaches for the other on the very next round
 * regardless. Also NOT in react-scaffold.ts's default package.json or
 * SandpackReactPreview.tsx's always-on dependencies — conditional on
 * the live connection, same as supabase-js.
 */
const ALLOWED_PACKAGES = new Set([
  "react",
  "react-dom",
  "framer-motion",
  "lucide-react",
  "react-router-dom",
  "react-router",
  "@tanstack/react-query",
  "zustand",
  "date-fns",
  "react-hook-form",
  "zod",
  "@hookform/resolvers",
  "react-markdown",
  "@dnd-kit/core",
  "@dnd-kit/sortable",
  "@dnd-kit/utilities",
  "recharts",
  "@supabase/supabase-js",
  "@stripe/stripe-js",
  "@stripe/react-stripe-js",
]);

/** import/export ... from "x" | require("x") | import("x") */
const IMPORT_PATTERNS = [
  /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*["']([^"']+)["']/g,
  /(?:^|\n)\s*import\s*["']([^"']+)["']/g,
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
];

/** Bare specifier -> package name ("@scope/pkg/x" -> "@scope/pkg"). */
function packageName(specifier: string): string {
  const parts = specifier.split("/");
  return specifier.startsWith("@") && parts.length > 1
    ? `${parts[0]}/${parts[1]}`
    : parts[0];
}

/** One forbidden import found in the generated project. */
export interface ForbiddenImport {
  file: string;
  packageName: string;
}

/**
 * Scans .js/.jsx project files for imports of packages that are not
 * installed. Relative ("./x"), absolute ("/x"), and URL imports are
 * fine; so are react/react-dom subpaths like "react-dom/client".
 */
export function findForbiddenImports(
  files: GeneratedFile[],
): ForbiddenImport[] {
  const found: ForbiddenImport[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    if (!/\.(jsx|js)$/.test(file.name)) continue;
    // Config files legitimately import build tooling (vite,
    // @vitejs/plugin-react) — scanning them produced false warnings
    // on every clean generation (2026-07-12 user report).
    if (/(^|\/)(vite|tailwind|postcss)\.config\.(js|ts|mjs)$/.test(file.name)) {
      continue;
    }
    for (const pattern of IMPORT_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(file.content)) !== null) {
        const specifier = match[1];
        if (
          specifier.startsWith(".") ||
          specifier.startsWith("/") ||
          specifier.startsWith("http://") ||
          specifier.startsWith("https://")
        ) {
          continue;
        }
        const pkg = packageName(specifier);
        if (ALLOWED_PACKAGES.has(pkg)) continue;
        const key = `${file.name} ${pkg}`;
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({ file: file.name, packageName: pkg });
      }
    }
  }
  return found;
}

/**
 * Plain-language chat warning for a non-technical user, phrased so
 * the recovery is copy-paste obvious. Returns null when clean.
 */
export function forbiddenImportWarning(
  imports: ForbiddenImport[],
): string | null {
  if (imports.length === 0) return null;
  const names = [...new Set(imports.map((i) => i.packageName))];
  const list = names.map((n) => `"${n}"`).join(", ");
  return (
    `Heads up: this version tries to use ${list}, which isn't available, ` +
    "so the preview may show an error. Just send me: " +
    `"Remove ${list} and build that feature without any extra packages" ` +
    "and I'll fix it. (Pasting any red error from the preview here also works.)"
  );
}
