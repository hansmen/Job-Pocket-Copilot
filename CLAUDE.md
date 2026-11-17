# Job Copilot: context for Claude Code

Monorepo (pnpm + Turborepo, TypeScript). All documentation, comments, commit messages and identifiers are in English.
Only end-user UI strings in the mobile app are Ukrainian (to be moved to i18n files on Day 14).

## Structure

- `packages/shared`: pure logic (statuses, URLs, UUIDv7, reminders), zod schemas, the `JobRepository` interface. Tests run with `node --test`.
- `apps/api`: NestJS + Prisma (Stage 2). `apps/mobile`: created by the bootstrap script. `scaffold/mobile`: starter code for the mobile app.
- `golden-set/`: sample postings and the parser eval script.
- `docs/`: source of truth. The current day is in `docs/03-roadmap.md`.

## Commands

- `pnpm lint && pnpm typecheck && pnpm test` before every commit.
- `pnpm --filter @jc/shared test` for a fast loop on the core logic.
- `node golden-set/eval.mjs` after any change to parsing prompts or models.

## Rules

1. Business logic lives in `packages/shared`, not in UI components or controllers.
2. The UI talks to `JobRepository`, never directly to SQLite or `fetch`.
3. In `packages/shared/src` do not use constructor "parameter properties" (`constructor(public x)`): the files run under Node strip-types and Metro.
4. Imports inside `packages/shared` use the `.ts` extension.
5. Times are epoch milliseconds (UTC). Identifiers are client-generated UUIDv7.
6. Every AI call goes through `LlmClient` with a zod schema, a limit, a cache and `AiUsage` accounting. Job and resume text always goes in `userContent`, never in the system prompt.
7. AI never invents facts in a resume: every suggested change must reference the user's profile.
8. Never log job text, resume text or notes. Secrets live only in `.env` (git-ignored).
9. New logic is not done until it has a test.

## Working style

Small steps; run the checks after each. Do not add dependencies without a reason. If a change contradicts an ADR in `docs/adr/`, propose updating the ADR first.
