# Architecture

```
Mobile (Expo) --+
Web (Next.js) --+--> API (NestJS, OpenAPI) --> Postgres (Prisma)
Clipper / bot --+            |                  +--> S3-compatible storage (files)
                             +--> Queue (pg-boss) --> LlmClient --> AI provider
        packages/shared: schemas, status rules, API client (imported by all)
```

## Stack

| Layer | Choice | Note |
| --- | --- | --- |
| Monorepo | pnpm + Turborepo | one repo, shared types |
| Mobile | Expo (dev builds + EAS), TS, Expo Router | the share extension does not work in Expo Go |
| Client data | expo-sqlite + Drizzle | behind `JobRepository` |
| API | NestJS + OpenAPI | clients are generated from OpenAPI |
| DB | PostgreSQL + Prisma | `apps/api/prisma/schema.prisma` |
| Auth | Firebase Auth | a guard verifies the ID token |
| Background jobs | pg-boss | no Redis needed |
| AI | `LlmClient` + zod structured output | provider is swappable |
| Payments (Stage 4) | RevenueCat (mobile), Stripe (web) | entitlements live on the backend |
| Quality | Sentry, PostHog, GitHub Actions | |

## Three rules that make the backend reusable for the web

1. All schemas and rules live in `packages/shared`.
2. Clients go through `JobRepository`: SQLite (Stage 1), API with cache and outbox (Stage 2+), API for the web.
3. The API is described in OpenAPI: `GET /openapi.json` -> client generation (`orval` or `openapi-typescript`).

## Sync (Stage 2)

- The server is the source of truth; the client keeps a local copy.
- Client changes are written to a queue (outbox) with an idempotency key (operation id).
- Conflicts: last write wins by `updatedAt`. For a single user that is enough.
- Deletes are soft (`deletedAt`) so changes reach other devices.
- First sign-in: local data is uploaded to the server once.
- Alternatives if it gets tight: PowerSync, WatermelonDB sync. Not needed for the MVP.

## Known technical gotchas

- `@jc/shared` is ESM while the NestJS skeleton compiles to CommonJS. Node 22.12+ can `require()` ESM so it should work, but if you see
  `ERR_REQUIRE_ESM`, switch the API to ESM or build shared in two formats.
- Metro reads `src/index.ts` from the `react-native` field of `packages/shared/package.json`; Node/Nest read `dist`.
  After changing shared for the API, run `pnpm --filter @jc/shared build`.
- `uuidv7()` in React Native needs `react-native-get-random-values` (import it first thing in the app entry).
- Classes in `packages/shared/src` must not use constructor parameter properties (strip-types compatibility).

## Generating the API client (Stage 2A)

```bash
pnpm --filter @jc/api dev            # API on :3000
curl localhost:3000/openapi.json > packages/api-client/openapi.json
# then: orval or openapi-typescript -> packages/api-client/src
```
