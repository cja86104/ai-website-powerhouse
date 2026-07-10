import type { NextConfig } from "next";

/**
 * Security headers (W4, Section 9 W4 Wed).
 *
 * Notes on the CSP:
 *  - `script-src 'unsafe-inline'` + `'unsafe-eval'` are required by
 *    Next.js hydration/dev tooling; a nonce-based CSP is a post-launch
 *    tightening item.
 *  - `style-src 'unsafe-inline'` for styled JSX / Tailwind inline vars.
 *  - `connect-src` allows Supabase (auth/DB), OpenRouter (BYOK
 *    browser-direct path), and localhost Ollama on any port.
 *  - `frame-src` blob:/data: for the legacy srcdoc iframe, plus
 *    https://*.codesandbox.io — Sandpack (W6) renders the React live
 *    preview in an iframe served from codesandbox.io; without this
 *    the browser silently blocks the frame and the preview is blank.
 *  - `connect-src`/`worker-src` codesandbox.io + blob: — the Sandpack
 *    client fetches bundler assets and spawns blob: workers from the
 *    parent page.
 *  - `img-src` data:/blob: — generated sites embed base64 images.
 * The preview iframe's own content is sandboxed by the iframe origin,
 * not by this policy.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co https://openrouter.ai https://*.codesandbox.io http://localhost:* http://127.0.0.1:*",
      "frame-src 'self' blob: data: https://challenges.cloudflare.com https://*.codesandbox.io",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
] as const;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [...securityHeaders],
      },
    ];
  },
};

export default nextConfig;
