# AI Website Powerhouse

Generate complete websites from natural-language prompts — with the AI provider **you** choose. Runs against a local [Ollama](https://ollama.com/) server, your own [OpenRouter](https://openrouter.ai/) account (BYOK), or a host-provided key. Your work is saved to your account and survives any browser, any machine.

> **Status: pre-1.0, active development.** The multi-tenant SaaS core is now in place: accounts (Supabase Auth), database-backed projects with full generation history, and Stripe subscription billing (test mode). In progress next: React + Vite project-tree output, Sandpack live preview, one-click deploys. Follow commits on `main`.

---

## What this is

- **Provider-agnostic LLM streaming.** One internal helper (`lib/llm.ts`) drives both Ollama (NDJSON) and OpenRouter (OpenAI-style SSE) so the UI never has to know which provider produced the bytes.
- **Three ways to run inference:**
  1. **Local Ollama** — never makes outbound calls beyond your Ollama server.
  2. **BYOK OpenRouter** — paste your key in Settings; the browser calls OpenRouter directly. Your key never touches our server. Unlimited, free.
  3. **Hosted key** — no key needed; generations go through the authenticated `/api/openrouter` proxy. Free accounts get 3/day; Pro gets 200/month.
- **Accounts & persistence.** Sign-up/sign-in via Supabase Auth (email confirmation, password reset, account deletion). Every completed generation is stored — files with content hashes, the prompt, the provider/model, and the chat thread — under row-level security.
- **Billing (Stripe, test mode).** Pro at $19/mo or $190/yr via Stripe Checkout; cancel/switch/update-card via the Stripe Customer Portal. Subscription state is written exclusively by a signature-verified, idempotent webhook.
- **Output formats.** Single- and multi-file HTML/CSS/JS today; React + Vite project trees are the next major milestone.
- **Honest telemetry posture.** No tracking in this build. Opt-in observability (Sentry, PostHog) arrives later with clear disclosure.

## What this is NOT (yet)

- No live-updating preview during generation (streamed code view now; Sandpack preview upcoming).
- No one-click deploys or GitHub sync yet (manual ZIP download works).
- Rate limiting and abuse hardening are still in progress — if you deploy this publicly with a real `OPENROUTER_API_KEY`, know that the proxy is auth- and subscription-gated, but per-IP rate limits and spend caps are not in yet.
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

**1. Supabase (required).** Create a free project at [supabase.com](https://supabase.com), then in the SQL editor run the files in `supabase/migrations/` in order (`0001`, `0002`, `0003`). Copy the project URL and keys into `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co   # bare URL, no path
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
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

In-app Settings panel: provider toggle (Ollama / OpenRouter), Ollama URL, OpenRouter BYOK key + curated model catalog with verified pricing, and sampling parameters. Account page (`/account`): plan, upgrade, billing portal, sign-out, account deletion.

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
│   ├── (auth)/                   # sign-in/up, password reset + server actions
│   ├── account/                  # plan, billing portal, deletion
│   ├── api/openrouter/route.ts   # server-side OpenRouter proxy
│   ├── api/stripe/webhook/       # subscription state machine (idempotent)
│   └── auth/                     # email-confirmation callback, sign-out
├── components/                   # modular UI (builder, chat, settings, files…)
├── lib/
│   ├── llm.ts                    # provider-agnostic streaming helper
│   ├── models.ts                 # curated OpenRouter model catalog
│   ├── supabase/                 # browser/server/admin clients + middleware
│   ├── projects/                 # workspace load/persist server actions
│   ├── stripe/                   # Stripe client + price resolution
│   ├── billing/                  # subscription gate for hosted generations
│   └── crypto/                   # AES-256-GCM at-rest secrets encryption
├── supabase/migrations/          # 0001 schema · 0002 RLS · 0003 stripe events
└── scripts/                      # stripe-setup.mjs
```

## Roadmap

Done: modular refactor, Supabase auth, DB-backed projects with generation history, Stripe checkout + customer portal + webhook state machine, free-tier gating.

Next: React + Vite project-tree output, Sandpack live preview, multi-project dashboard with version history, one-click Vercel deploy, GitHub App sync, usage metering, packaged Docker Compose self-host.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and pull requests welcome. For any change beyond a small bug fix or doc tweak, please open an issue to discuss before writing code.

## Reporting a security vulnerability

See [SECURITY.md](./SECURITY.md). **Do not file public issues for security vulnerabilities.**

## Licensing

Licensed under the [Functional Source License, Version 1.1, ALv2 Future License](./LICENSE) (FSL-1.1-ALv2). In plain English:

- You can use, modify, and redistribute this code for any purpose **except** offering a substantially similar hosted product or service that competes with us.
- Two years after each release, that release converts automatically to the Apache License 2.0.

If you want to use AIWP commercially in a way the FSL does not permit, contact the maintainer to discuss licensing.
