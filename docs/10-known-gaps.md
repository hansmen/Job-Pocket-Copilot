# Known gaps of this starter kit

An honest list of what has **not** been verified, so you do not waste time guessing.

## Verified

- `packages/shared`: 28 tests (statuses, URLs, UUIDv7, reminders) pass on Node 22.
- `golden-set/eval.mjs`: runs on 8 synthetic postings; the baseline scores 0.774 overall and fails the informal and Ukrainian postings as intended.
- `scripts/create-issues.mjs`: `--dry-run` and backlog validation (37 issues, 6 milestones, 9 labels). The real run against GitHub was **not** executed.
- Types of `packages/shared` were checked with the compiler; the only errors were from `zod` and `@types/node` not being installed (they come with `pnpm install`).

## Not verified (no network for installing dependencies, no device)

- Building and running `apps/api` (NestJS + Prisma): needs `pnpm install`, Postgres, `prisma generate`.
- All of `scaffold/mobile`: the Drizzle schema, `SqliteJobRepository`, notifications, screens. Expect fixes for current Expo SDK, `expo-notifications` and `expo-share-intent` versions.
- `scripts/bootstrap-mobile.sh`: `create-expo-app` flags may differ in your version.
- `scripts/create-issues.mjs` against real GitHub: label creation, milestone API and issue creation.
- The zod schemas in `packages/shared/src/schemas.ts` were never executed (no `zod` installed). Add tests for them on Day 1-2.
- The Prisma schema has not been through `prisma validate` or a migration.
- CI (`.github/workflows/ci.yml`) has never run; the `pnpm/action-setup` step relies on the `packageManager` field, and the `pnpm-lock.yaml` does not exist yet (the first `pnpm install` creates it; commit it, since CI uses `--frozen-lockfile`).

## Decisions worth revisiting deliberately

- Firebase Auth vs Supabase Auth: Firebase was chosen because it is familiar. If you want fewer moving parts, Supabase gives Postgres + Auth + Storage together.
- Zod 3 in `package.json`: if you install Zod 4, check `z.ZodType<T>` compatibility in `llm-client.ts`.
- Expo Router with `typedRoutes`: after the first run, route type fixes may be needed.
- Manual validation in `jobs.controller.ts`: replace it with DTOs (`nestjs-zod`) in Stage 2A.
- NestJS in CommonJS with the ESM package `@jc/shared`: see `docs/02-architecture.md`.
- The `packageManager` field pins `pnpm@10.0.0`; bump it to whatever you actually have installed.
- UI strings are hard-coded in Ukrainian; move them to i18n on Day 14.

## What to add first when you start

1. Tests for the zod schemas.
2. A `syncFollowUp` test with a fake repository.
3. Integration tests for `SqliteJobRepository` (Jest + `better-sqlite3`, or on a device).
4. `prisma migrate dev --name init` and the first e2e tests for `/health` and `/jobs`.
5. Commit `pnpm-lock.yaml` after the first install.
