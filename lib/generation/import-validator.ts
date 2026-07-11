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

/** Packages the pinned scaffold actually provides. */
const ALLOWED_PACKAGES = new Set(["react", "react-dom"]);

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
