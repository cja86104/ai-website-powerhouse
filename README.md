# AI Website Powerhouse

A developer tool for generating React + Vite (and legacy HTML/CSS/JS) websites from natural-language prompts. Pluggable LLM providers — runs against a local [Ollama](https://ollama.com/) server, your own [OpenRouter](https://openrouter.ai/) account, or a host-provided OpenRouter key.

> **Status: pre-1.0, active development.** The current public build is the single-user version. A multi-tenant SaaS rewrite is in progress; see roadmap below.

---

## What this is

- **Provider-agnostic LLM streaming.** One internal helper (`lib/llm.ts`) drives both Ollama (NDJSON) and OpenRouter (OpenAI-style SSE) so the UI never has to know which provider produced the bytes.
- **Three ways to call OpenRouter:**
  1. Paste your own key in Settings — the browser calls OpenRouter directly (BYOK, your key never leaves your browser).
  2. No user key, but the host has `OPENROUTER_API_KEY` set — calls go through `/api/openrouter` (server proxy with attribution headers).
  3. Neither configured — OpenRouter is reported as unavailable; Ollama still works.
- **Local-first stays local-first.** Ollama mode never makes outbound network calls beyond your Ollama server.
- **Output formats.** React + Vite project tree (default for new generations) and a legacy single-page HTML/CSS/JS mode (retained for compatibility).
- **No data collection.** This codebase ships no telemetry. The future SaaS build will add opt-in observability (Sentry, PostHog) gated behind clear disclosure.

## What this is NOT (yet)

- Not multi-tenant. No auth, no projects, no billing in this build — those land in the SaaS rewrite.
- Not "100% local." Ollama mode is local, but OpenRouter mode is a cloud call.
- Not production-hardened for public deployment. The OpenRouter proxy route is unauthenticated; do not deploy it publicly with a real `OPENROUTER_API_KEY` without adding rate limits and a spend cap first.

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js     | 20+     | Tested on 20.x and 22.x. |
| Next.js     | 16.1.1  | Pinned in `package.json`. |
| Ollama      | latest  | Required only if you want the local LLM path. |
| OpenRouter account | — | Required only if you want the cloud LLM path. Free tier works for testing. |

For Ollama, pull a coding-capable model before first run, e.g.:

```bash
ollama pull qwen2.5-coder:14b
```

## Quick start

```bash
git clone https://github.com/cja86104/ai-website-powerhouse.git
cd ai-website-powerhouse
npm install
cp .env.example .env.local   # fill in only the keys you actually use
npm run dev
```

Then open <http://localhost:4000>. Port 4000 is intentional — it's pinned in `package.json` so existing bookmarks and tester instructions don't drift.

## Configuration

Open the in-app Settings panel to set:

- **Provider.** Ollama or OpenRouter.
- **Ollama URL.** Defaults to `http://localhost:11434`. Override for remote / containerized Ollama.
- **Ollama model.** e.g. `qwen2.5-coder:14b`.
- **OpenRouter API key.** Pasted here for browser-direct calls. If you leave this blank, the app falls back to the server proxy (`/api/openrouter`) when `OPENROUTER_API_KEY` is set on the host.
- **OpenRouter model.** Selected from a curated catalog with verified pricing.
- **Sampling parameters.** Temperature, top-p, top-k, max tokens, context size.

Environment variables live in `.env.local` (gitignored). See `.env.example` for every variable the app currently reads plus the variables reserved for the in-progress SaaS rewrite.

## Available scripts

```bash
npm run dev      # next dev -p 4000
npm run build    # next build
npm run start    # next start
npm run lint     # eslint
npx tsc --noEmit # typecheck
```

## Project structure

```
ai-website-powerhouse/
├── app/
│   ├── api/openrouter/route.ts  # server-side OpenRouter proxy
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── AIWebsitePowerhouse.js   # single-file UI (refactor in progress)
├── lib/
│   ├── llm.ts                   # provider-agnostic streaming helper
│   └── models.ts                # curated OpenRouter model catalog
└── public/                      # static assets
```

## Roadmap

The single-user codebase is being rewritten into a multi-tenant SaaS with auth, billing, project persistence, live preview via Sandpack, and one-click deploy to Vercel and GitHub. The OSS repo will remain self-hostable via Docker Compose under the Functional Source License (see Licensing below).

The rewrite is happening in this repo on `main`. Follow commits and releases for progress.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and pull requests welcome. For any change beyond a small bug fix or doc tweak, please open an issue to discuss before writing code.

## Reporting a security vulnerability

See [SECURITY.md](./SECURITY.md). **Do not file public issues for security vulnerabilities.**

## Licensing

Licensed under the [Functional Source License, Version 1.1, ALv2 Future License](./LICENSE) (FSL-1.1-ALv2). In plain English:

- You can use, modify, and redistribute this code for any purpose **except** offering a substantially similar hosted product or service that competes with us.
- Two years after each release, that release converts automatically to the Apache License 2.0.

If you want to use AIWP commercially in a way the FSL does not permit, contact the maintainer to discuss licensing.
