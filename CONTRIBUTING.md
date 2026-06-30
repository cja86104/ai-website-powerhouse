# Contributing to AI Website Powerhouse

Thanks for your interest in AIWP. This file describes how to file issues, propose changes, and get a PR merged.

## Before you start

This project is in active rewrite. The codebase will change substantially between now and the v1.0 launch. If you are planning anything beyond a small bug fix or doc tweak, **please open an issue first** so we can talk about it before you write code. Otherwise there is a real risk your PR will conflict with work-in-progress on a branch you cannot see.

For security vulnerabilities, do **not** open a GitHub issue. See [SECURITY.md](./SECURITY.md).

## Filing an issue

Use [GitHub Issues](https://github.com/cja86104/ai-website-powerhouse/issues). A good bug report includes:

- AIWP version (commit hash or release tag).
- Node.js version (`node --version`).
- OS and browser if the bug is visible in the UI.
- Provider used (Ollama or OpenRouter), and which model.
- A minimal prompt that reproduces the problem.
- What you expected vs. what happened. Include console errors and the contents of the network tab when relevant.

For feature requests, describe the problem you are trying to solve before proposing a solution.

## Branching and PR model

- `main` is the only long-lived branch. It is protected.
- Open feature branches from `main`. Name them `feat/<short-description>`, `fix/<short-description>`, `chore/<short-description>`, or `docs/<short-description>`.
- Open a pull request against `main`. Keep PRs scoped — one logical change per PR.
- Rebase on `main` before requesting review. Resolve conflicts locally, never with the GitHub web merge tool on a contested file.

## Required checks before opening a PR

Every PR must pass these three commands locally before it will be reviewed:

```bash
npm run lint            # 0 errors, 0 new warnings
npm run build           # completes
npx tsc --noEmit        # 0 errors
```

If you touch the OpenRouter integration, also run the smoke-test groups documented in the maintainer's internal QA notes (Groups A + B + C minimum). The maintainer will confirm which groups apply to your change in code review.

## Code style

- TypeScript strict mode is enabled. New code is TypeScript by default. No `any` without an inline justification comment.
- React hooks must be declared **before any conditional return** in every component. This is a recurring bug class and CI will reject violations.
- Prefer small, focused functions. Add TSDoc to anything exported from `lib/`.
- Match the existing file's conventions when you edit it. Don't reformat unrelated lines.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/). Examples:

```
feat(generation): add Vite project-tree output parser
fix(openrouter): handle non-JSON error bodies from upstream
chore(docs): tighten README quickstart
refactor(prompts): extract prompt builder into lib/prompts
```

Subject lines under 72 characters. Body explains *why* the change is needed, not just *what* changed.

## Do not modify these files without explicit maintainer approval

The following files are the gold-standard OpenRouter integration and are pre-approved as production-quality:

- `lib/llm.ts`
- `lib/models.ts`
- `app/api/openrouter/route.ts`

If your work needs to extend one of these, open an issue first describing the proposed change and why it must live in that file rather than alongside it.

## License of contributions

By submitting a pull request you agree that your contribution is licensed under the same Functional Source License, Version 1.1, ALv2 Future License as the rest of the project. See [LICENSE](./LICENSE).
