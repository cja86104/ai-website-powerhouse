# AI Website Powerhouse

Generate complete websites from natural-language prompts — with the AI provider **you** choose. Runs against a local [Ollama](https://ollama.com/) server, your own [OpenRouter](https://openrouter.ai/) account (BYOK), or a host-provided key. Your work is saved to your account and survives any browser, any machine.

> **Status: pre-1.0, active development.** The multi-tenant SaaS core is in place: accounts (Supabase Auth), database-backed multi-project workspace with full generation history, Stripe subscription billing with metered premium SKUs (test mode), Sandpack live preview, one-click Vercel deploy, image uploads, and file-scoped delta edits. In progress: per-project cost ledger, GitHub App push, usage metering. Follow commits on `main`.

---

## What this is

- **Provider-agnostic LLM streaming.** One internal helper (`lib/llm.ts`) drives both Ollama (NDJSON) and OpenRouter (OpenAI-style SSE) so the UI never has to know which provider produced the bytes.
- **Three ways to run inference:**
  1. **Local Ollama** — never makes outbound calls beyond your Ollama server.
  2. **BYOK OpenRouter** — paste your key in Settings; the browser calls OpenRouter directly. Your key never touches our server. Unlimited, free.
  3. **Hosted key** — no key needed; generations go through the authenticated `/api/openrouter` proxy. Free accounts get 3/day; Pro gets 200/month.
- **Two output formats.** Classic HTML/CSS/JS (single- and multi-file) and React + Vite project trees. React output uses a `===AIWP:FILE path="..."===` marker contract, is scaffolded with pinned deps and a Tailwind CDN setup, and includes an import whitelist validator (framer-motion, lucide-react, react-router-dom supported; unknown deps caught before preview).
- **Sandpack live preview.** React projects render in an in-browser Vite dev server (via `@codesandbox/sandpack-react`). HTML projects preview in a sandboxed iframe. Preview auto-updates after every modify round.
- **Delta edits.** Chat modifications return only changed files, not the full project — simple edits go from a full-rebuild to seconds. Unchanged files are kept automatically.
- **File-scoped chat.** Scope a chat message to one file; the model sees only that file plus the project path listing, saving tokens and keeping surrounding code untouched.
- **Multi-project workspace.** Dashboard at `/dashboard` shows active and archived projects with framework badges and rename. Each project has its own generation history; open any prior version or fork it into a new project.
- **Image uploads.** Upload photos and logos via the Assets panel; they're stored in Supabase Storage and their URLs are injected into generation prompts. Numbered "Spots" overlay lets you target image slots by number (e.g., "put my logo in spot 3").
- **Accounts & persistence.** Sign-up/sign-in via Supabase Auth (email confirmation, password reset, account deletion). Every completed generation is stored — files with content hashes, the prompt, the provider/model, and the chat thread — under row-level security. OpenRouter key, model preference, and max-token setting all follow the account across browsers.
- **Billing (Stripe, test mode).** Pro at $19/mo or $190/yr via Stripe Checkout; cancel/switch/update-card via the Stripe Customer Portal. Subscription state is written exclusively by a signature-verified, idempotent webhook. Premium metered SKUs on top of Pro: Qwen3-Coder 480B ($0.15/gen), Haiku ($0.30/gen), Sonnet 5 ($0.75/gen), Opus 4.8 ($2.00/gen) — applies to both builds and edits.
- **Usage chip.** Header shows hosted generations used vs. limit in the same rolling window the quota gate enforces, with a tooltip breakdown by provider.
- **One-click Vercel deploy.** Paste your Vercel token once; the Deploy button uploads the latest saved snapshot to your Vercel account (`framework: vite` for React, static for HTML), polls for build completion, and shows the live URL.
- **Security hardening.** Upstash sliding-window rate limiting (auth and generation endpoints), optional Cloudflare Turnstile on sign-up, disposable-domain blocklist, CSP + security headers, AES-256-GCM at-rest secrets encryption for stored keys and tokens.
- **Account-synced model preferences.** OpenRouter model, custom slug, and max-token setting (default 45k) persist to the account — change once, any device picks it up.
- **Honest telemetry posture.** No tracking in this build. Opt-in observability (Sentry, PostHog) arrives later with clear disclosure.

## What this is NOT (yet)

- No per-project cost ledger or CSV export yet (in progress).
- No GitHub App push yet — register a GitHub App, then the push-to-repo feature ships.
- Rate limiting and abuse hardening are in place (Upstash + auth gates), but per-IP spend caps are not yet enforced.
- The one-click Vercel deploy is code-complete but the end-to-end test (token → live URL) is still pending user verification.
- The packaged Docker Compose self-host bundle is on the roadmap; today self-hosting means running this repo plus your own Supabase project.

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js     | 20+     | Tested on 20.x and 22.x. |
| Supabase project | free tier | **Required** — the app is account-based. Five minutes to set up. |
| Ollama      | latest  | Only for the local LLM path. |
| OpenRouter account | — | Only for the cloud LLM path. |
| Stripe account | test mode | Only if you want the billing features. |
| Upstash Redis | free tier | Only if you want rate limiting (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`). |

For Ollama, pull a coding-capable model before first run, e.g.:

```bash
ollama pull qwen2.5-coder:14b
```

## Quick start

```bash
git clone https://github.com/cja86104/ai-website-powerhouse.git
cd ai-website-powerhouse
npm install
cp .env.example .env.local
```

**1. Supabase (required).** Create a free project at [supabase.com](https://supabase.com), then in the SQL editor run the files in `supabase/migrations/` in order (`0001` through `0007`). Copy the project URL and keys into `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co   # bare URL, no path
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ENCRYPTION_KEY_V1=...   # 32-byte key, base64 or hex — used for AES-256-GCM secrets at rest
```

**2. Stripe (optional).** For billing features, put your **test-mode** secret key in `.env.local`, then create the product catalog and paste the printed price IDs:

```bash
node scripts/stripe-setup.mjs
```

For webhooks locally: `stripe listen --forward-to localhost:4000/api/stripe/webhook` and copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

**3. Run.**

```bash
npm run dev
```

Open <http://localhost:4000>, create an account, and generate. Port 4000 is intentional and pinned in `package.json`.

## Configuration

In-app Settings panel: provider toggle (Ollama / OpenRouter), Ollama URL, OpenRouter BYOK key + curated model catalog with verified pricing, and sampling parameters (max tokens default 45k). Account page (`/account`): plan, upgrade, billing portal, sign-out, account deletion. Deploy modal: Vercel token entry and one-click deploy.

See `.env.example` for every environment variable with inline documentation.

## Available scripts

```bash
npm run dev              # next dev -p 4000
npm run build            # next build
npm run start            # next start
npm run lint             # eslint
npx tsc --noEmit         # typecheck
node scripts/stripe-setup.mjs   # one-shot Stripe test catalog (idempotent)
```

## Project structure

```
ai-website-powerhouse/
├── app/
│   ├── (auth)/                   # sign-in/up, forgot/reset password + server actions
│   ├── (legal)/                  # privacy, terms, refunds pages
│   ├── account/                  # plan, billing portal, deletion
│   ├── dashboard/                # multi-project view (active + archived)
│   ├── p/[projectId]/            # per-project workspace route
│   ├── api/openrouter/route.ts   # server-side OpenRouter proxy (auth + quota gated)
│   ├── api/stripe/webhook/       # subscription state machine (idempotent)
│   └── auth/                     # email-confirmation callback, sign-out
├── components/
│   ├── assets/                   # AssetsPanel — image upload + Spots overlay
│   ├── chat/                     # ChatInterface, MessageList, MessageInput
│   ├── dashboard/                # RenameProjectButton
│   ├── files/                    # FileBrowser, FileTab, DownloadButton
│   ├── generation/               # GenerationPanel, PromptForm, TemplatePicker (31 built-ins)
│   ├── history/                  # HistoryPanel — version list, Open, Fork
│   ├── layout/                   # Header, ChipRow, UsageChip
│   ├── modals/                   # DeployModal (Vercel), GithubPanel
│   ├── preview/                  # PreviewPanel, SandpackReactPreview
│   ├── settings/                 # SettingsPanel and all section components
│   └── shared/                   # ErrorBoundary, HydrationGate, Skeleton
├── lib/
│   ├── assets/                   # Supabase Storage upload (browser-direct)
│   ├── auth/                     # Turnstile verification, disposable-domain blocklist
│   ├── billing/                  # quota gate, usage queries, premium meter events
│   ├── crypto/                   # AES-256-GCM at-rest secrets (versioned key rotation)
│   ├── deploy/                   # Vercel API client (server-only, token never returned to browser)
│   ├── generation/               # parser, project-parser, react-scaffold, scoped-parser,
│   │                             #   slot-renumber, import-validator, delta merge
│   ├── integrations/             # OpenRouter key + Vercel token account sync actions
│   ├── llm.ts                    # 🔒 provider-agnostic streaming helper
│   ├── models.ts                 # 🔒 curated OpenRouter model catalog with pricing
│   ├── preview/                  # slot-badges (Spots overlay, preview-only)
│   ├── projects/                 # workspace load/persist/fork/rename server actions
│   ├── prompts/                  # system/modify/react/scoped prompts + image-slot rules
│   ├── ratelimit/                # Upstash sliding-window rate limiter
│   ├── store/                    # Zustand 5 stores (settings, generation, chat, ui, …)
│   ├── stripe/                   # Stripe client + price resolution
│   ├── supabase/                 # browser/server/admin clients + middleware
│   ├── templates/                # account-synced user template actions
│   └── utils/                    # debounce, download, sampling helpers
├── supabase/migrations/
│   ├── 0001_initial.sql          # 8 tables, indexes, triggers
│   ├── 0002_rls.sql              # RLS on all tables
│   ├── 0003_stripe_events.sql    # idempotency ledger for webhook replays
│   ├── 0004_cancel_at_period_end.sql
│   ├── 0005_user_templates.sql   # account-synced templates
│   ├── 0006_openrouter_prefs.sql # account-synced model/token prefs
│   └── 0007_project_assets.sql   # public project-assets bucket + policies
└── scripts/
    └── stripe-setup.mjs          # idempotent test-mode catalog creator
```

## Roadmap

**Done:** modular refactor, Supabase auth, DB-backed multi-project workspace with generation history and fork, Stripe checkout + customer portal + webhook state machine + free-tier gating, React + Vite project-tree output, Sandpack live preview, file-scoped chat, delta edits, multi-project dashboard, version history, one-click Vercel deploy, image uploads + numbered Spots overlay, project auto-naming + rename, account-synced key/model/tokens, premium metered SKUs (Qwen3-Coder 480B / Haiku / Sonnet 5 / Opus 4.8), usage chip, security hardening (rate limiting, Turnstile, disposable-domain block, CSP, security headers, AES-256-GCM secrets), legal pages, 31 built-in prompt templates.

**In progress (W9):** per-project cost ledger + CSV export, GitHub App OAuth + push-to-repo, usage metering reconciliation.

**Next:** packaged Docker Compose self-host, visual redesign, marketing website, full 57-item smoke test sign-off.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and pull requests welcome. For any change beyond a small bug fix or doc tweak, please open an issue to discuss before writing code.

## Reporting a security vulnerability

See [SECURITY.md](./SECURITY.md). **Do not file public issues for security vulnerabilities.**

## Licensing

Licensed under the [Functional Source License, Version 1.1, ALv2 Future License](./LICENSE) (FSL-1.1-ALv2). In plain English:

- You can use, modify, and redistribute this code for any purpose **except** offering a substantially similar hosted product or service that competes with us.
- Two years after each release, that release converts automatically to the Apache License 2.0.

If you want to use AIWP commercially in a way the FSL does not permit, contact the maintainer to discuss licensing.
