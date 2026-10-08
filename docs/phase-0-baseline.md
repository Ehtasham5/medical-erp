# Phase 0 baseline

Recorded on 2026-10-08 on branch `codex/stabilize-phase-0`.

- ESLint: passing with `pnpm lint`.
- TypeScript: passing with `pnpm typecheck`.
- Production build: passing with `pnpm build`.
- Required environment variables are validated at application startup:
  `DATABASE_URL`, `CLERK_SECRET_KEY`, and
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

CI runs the lint, typecheck, and production-build commands for pull requests
and for pushes to the default branch.
