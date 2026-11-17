# Progress Plan

Use this file to track milestones and keep a simple status view of the project. Update checkbox states as work moves forward.

## Status legend

- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked / needs attention

---

## Current status

### Stage 0: foundation

- [x] Day 1. Repository and environment
  - Repo is initialized and working
  - PNPM toolchain enabled in the current session
  - Dependencies installed
  - Prisma client generated
  - `pnpm --filter @jc/shared test` passed
  - Full validation sequence passed: `pnpm lint && pnpm typecheck && pnpm test`
  - CI now generates the Prisma client before typechecking; latest CI passed
  - Notes: non-blocking API import-type lint warnings remain
- [!] Day 2. The mobile app on a phone — deferred
  - Expo project generated (SDK 58) and scaffold overlaid
  - Fixed the bootstrap script for Expo's `src/` starter layout
  - Initial Drizzle SQLite migration generated
  - Expo display name is Job Pocket Copilot; iOS and Android IDs are `com.jobpocketcopilot.mobile`
  - Expo development client installed
  - Android/iOS bundle exports and mobile TypeScript check passed
  - Remaining: build on macOS and verify the empty Jobs list on a real phone
- [!] Day 3. Monitoring and the golden set — deferred/partial
  - Synthetic baseline exists; Sentry, EAS profiles, and 10 hand-labeled private postings are not done
- [ ] Day 4. User research and sketches
  - Goal: 5+ messages, sketches, waitlist link live

### Stage 1: local MVP

- [ ] Day 5. Database
- [ ] Day 6. Repository
- [ ] Day 7. List and add screens
- [ ] Day 8. Details and statuses
- [ ] Day 9. Reminders
- [ ] Day 10. Share extension (iOS)
- [ ] Day 11. Share (Android) and simple text parsing
- [ ] Day 12. Filters, search, kanban
- [ ] Day 13. Export, import, settings
- [ ] Day 14. Quality and accessibility
- [ ] Days 15-20. A week of real use (dogfooding)
- [ ] Day 21. Stage 1 wrap-up

### Stage 2: backend and AI

- [~] API foundation — partial; do not treat the roadmap milestone as complete
  - NestJS, Prisma schema, Firebase/dev auth guard, and basic `/jobs` CRUD are present
  - Swagger `/docs` and OpenAPI JSON routes are configured
  - Baseline migration generated from `schema.prisma`; it has not been applied
  - Docker is unavailable and nothing is listening on local PostgreSQL port 5432
  - Verify migration application and production auth setup before relying on them
- [ ] Sync
- [~] AI job parsing — current priority
  - Existing foundations and remaining work are tracked below
- [ ] Profile and match
- [ ] Resume tailoring

### AI parsing handoff

This is the current workstream. Mobile device testing and the earlier roadmap items are intentionally deferred; do not mark Day 2 or Day 3 complete.

#### Already present

- `packages/shared/src/schemas.ts` defines `ParsedJobSchema`.
- `apps/api/src/llm/llm-client.ts` defines the provider-neutral `LlmClient` contract, structured Zod schema input, model tiers, untrusted `userContent`, optional images, and usage fields.
- `apps/api/src/llm/fake-llm-client.ts` provides a zero-cost fake that validates queued output against the requested schema.
- `apps/api/src/llm/llm.module.ts` registers the fake provider behind the metered client. Any non-fake `LLM_PROVIDER` currently throws; no real provider is implemented.
- `apps/api/src/llm/prompts/parse-job.ts` has `parse-job@1` and rules against prompt injection and invented facts.
- `apps/api/src/llm/fake-llm-client.test.ts` now covers successful schema validation, invalid output, and an empty response queue (3 tests pass).
- `apps/api/src/llm/parsed-job-cache.ts` implements a per-user cache keyed by normalized posting text and parser version; values are validated with `ParsedJobSchema`.
- `AiCache` and its generated initial-migration table are present; cache behavior tests use mocked storage (3 tests pass). Database persistence is not verified until the migration is applied.
- `apps/api/src/llm/metered-llm-client.ts` reserves a daily call and records provider usage; valid parsed-job cache hits are also recorded.
- Usage/quota tests cover default configuration, limit boundaries, HTTP 429 behavior, provider success/failure, and denial before a provider call (7 tests pass).
- Daily call limits are per user; the monthly budget blocks new calls after reported service-wide spend reaches the threshold. A final or concurrent call can exceed that threshold.
- API tests compile through Nest before running from `dist`; Node's strip-types runner cannot parse Nest decorators directly. No test dependency was added.
- Prisma's `Job` model has `rawText`, `parsed`, and `parserVersion` fields; an `AiUsage` model exists.
- `golden-set/eval.mjs` and 8 synthetic samples work. `node golden-set/eval.mjs` verified the regex baseline at **0.774**. This is not an AI score and no score threshold has been chosen.

#### Not implemented / not verified

- No parse-job service or API endpoint connects the prompt, schema, LLM client, and job persistence.
- The baseline Prisma migration exists but has not been applied; PostgreSQL persistence is still unverified.
- No real provider/client, provider selection, credentials, or model configuration. Ask the user before choosing a paid provider or adding its SDK/secrets.
- Cache database reads/writes have not been integration-tested against PostgreSQL; the baseline migration is generated but unapplied.
- Database-backed `AiUsage` writes and quota checks have not been integration-tested because the baseline migration is unapplied; mocked tests cover the metered client and quota decisions.
- Cache-miss-to-provider orchestration is not yet connected by a parse service.
- The monthly threshold is not a strict spend cap: the final or concurrent call can exceed it. A provider-specific hard cap/reservation is still needed before treating it as such.
- No real AI adapter for the golden-set evaluator, before/after AI score, or chosen acceptance threshold.
- No 10-posting anonymized private evaluation set. Keep real postings under ignored `golden-set/private/`; label expected results by hand.
- Image support exists only in the LLM request type; screenshot/vision parsing is not implemented.
- Retry/error behavior for a real provider and schema-invalid output has not been implemented or tested.

#### Suggested implementation order

1. [x] Verify the fake-client contract with tests; 3 API tests pass.
2. [x] Review the API/database state: basic API and Swagger exist, but migrations are absent and PostgreSQL is unverified.
3. [~] Generate the initial Prisma migration; apply and verify it once a PostgreSQL database is available.
4. [~] Implement cache persistence and mocked-storage tests; verify actual database persistence when PostgreSQL is available.
5. [~] Add `AiUsage` recording and daily/monthly threshold enforcement; mocked tests are in place, but verify persistence after applying migrations. The monthly threshold is not a strict cap.
6. [ ] Add a parse-job service using `LlmClient`, `PARSE_JOB_SYSTEM`, `PARSE_JOB_VERSION`, and `ParsedJobSchema`. Route every production call through schema validation, cache, limits, and usage accounting. Keep posting text exclusively in `userContent`.
7. [ ] Add provider-backed parsing only after the user chooses the provider, model, and budget. Keep credentials in ignored environment files; never log posting text.
8. [ ] Add an evaluator adapter, record the current synthetic baseline, then compare before/after on the same samples. Choose a target score before calling parsing accurate.
9. [ ] Collect and hand-label 10 anonymized private postings; use screenshots/vision as a separate follow-up.

#### Decisions still needed

- Provider and model (and their cost/limits).
- Minimum acceptable eval score and how to weigh field-level errors.
- Whether sync/API prerequisites should be completed before exposing parsing to a client.

### Stage 3: interview prep

- [ ] Week 9
- [ ] Week 10
- [ ] Week 11
- [ ] Week 12

### Stage 4: web, integrations, launch

- [ ] Week 13
- [ ] Week 14
- [ ] Week 15
- [ ] Week 16
- [ ] Week 17

---

## Weekly / session checklist

### Completed foundation work

- [x] Confirm roadmap day
- [x] Install missing tooling
- [x] Install repo dependencies
- [x] Validate shared tests
- [x] Run full validation chain
- [x] Move to Day 2 tasks

### Deferred mobile follow-up

- [x] Bootstrap mobile app
- [x] Review and fix `scripts/bootstrap-mobile.sh`
- [x] Merge app config values and set the app identifier
- [!] Build and run on a real phone
  - Resume on macOS with Xcode and a phone/simulator; run `npx expo run:ios` from `apps/mobile`
- [x] Check whether Expo/phone build dependencies are available locally
  - Git Bash is available; Android `adb` and iOS `xcrun` are not on this Windows machine

---

## Notes

- Day 1 is complete and satisfies the roadmap criterion.
- Day 2 setup and bundle validation are complete, but the roadmap's real-phone criterion is still pending.
- Current priority is Stage 2 AI job parsing; mobile, monitoring/golden-set collection, and sync work are deferred, not complete.
- Before starting an AI task, inspect its current files and this handoff section; update statuses and validation results here as work progresses.
- Keep this file updated after each milestone; use `[!]` for blocked or deferred items.
