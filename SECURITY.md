# Security Policy

## Supported versions

This project is pre-1.0. Only the latest commit on `main` is supported for security fixes. There are no maintained backports.

| Version          | Supported |
|------------------|-----------|
| `main` (latest)  | Yes       |
| Older commits    | No        |
| Pre-1.0 releases | No        |

After the first stable release, this table will be updated with a real support matrix.

## How to report a vulnerability

**Do not file a public GitHub issue for security vulnerabilities.**

Use one of the following private channels, in order of preference:

1. **GitHub private security advisory.** Go to <https://github.com/cja86104/ai-website-powerhouse/security/advisories/new> and submit a private report. This routes directly to the maintainer and creates a tracked advisory.
2. **Email.** Send to `cja86104@gmail.com` with `[AIWP SECURITY]` in the subject line. Include enough detail to reproduce. PGP is not yet set up; if you need encrypted transport, contact the maintainer to arrange a key exchange first.

When reporting, include:

- A description of the vulnerability and its impact.
- The commit hash or release tag you found it in.
- Steps to reproduce. A minimal proof-of-concept is ideal.
- Any logs, screenshots, or HTTP transcripts relevant to the bug.
- Whether you intend to publish a write-up, and if so, your preferred coordination window.

## What to expect

- **Acknowledgment:** within 72 hours of receipt.
- **Initial assessment:** within 7 calendar days, including a severity rating and a rough timeline for a fix.
- **Fix and disclosure:** the maintainer aims to ship a fix within 30 days for high-severity issues and 90 days for the rest. Public disclosure happens after the fix lands, coordinated with the reporter.

If you do not get an acknowledgment within 72 hours, please re-send your report and CC `cja86104@gmail.com` directly. Email can be missed.

## Scope

In scope:

- The AIWP application code in this repository.
- The `/api/openrouter` server proxy route.
- Authentication, authorization, billing, and data-handling code introduced by the in-progress SaaS rewrite (when it lands on `main`).

Out of scope:

- Vulnerabilities in third-party services (OpenRouter, Ollama, Supabase, Stripe, Vercel, etc.). Please report those to the vendor directly.
- Issues that require physical access to the user's machine, or that depend on a malicious browser extension already installed.
- Self-XSS where the user pastes attacker-controlled content into Settings (browser-side BYOK key field). Do not file these unless the application itself is the attack vector.
- Issues in user-supplied prompts to the LLM. Prompt injection against the generated website is the user's responsibility, not AIWP's.

## Safe-harbor

If you make a good-faith effort to comply with this policy during your security research, the maintainer will not pursue or support any legal action against you. Activities specifically allowed:

- Testing against your own local instance of AIWP.
- Reading source code in this repository.
- Reverse-engineering compiled artifacts that you produced yourself from this source.

Activities NOT allowed (you will lose safe-harbor protection):

- Attacking a hosted instance of AIWP that you do not own without explicit written permission.
- Accessing other users' data.
- Denial-of-service attacks against any AIWP-operated infrastructure.

## Hall of fame

Once the first vulnerability report comes in and is resolved, this section will list contributors who reported issues, with their consent.
