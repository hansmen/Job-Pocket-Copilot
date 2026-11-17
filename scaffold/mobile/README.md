# Mobile scaffold

These files are **not a finished app**. They are a starting point for Stage 1: the DB schema, a SQLite repository, a reminders service,
a notification scheduler and three basic screens. They are overlaid on the project that `create-expo-app` generates.

## How to apply (Day 2 of the roadmap)

```bash
./scripts/bootstrap-mobile.sh
```

The script creates `apps/mobile`, installs dependencies, copies these files and generates the first migration.
Read it before running: it deletes the demo code of the Expo template (`app/`, `components/`, etc.).

## What is in here

| Path | Purpose |
| --- | --- |
| `src/db/schema.ts`, `src/db/client.ts` | Drizzle schema (UUIDv7 ids, epoch-ms times, soft delete) and the SQLite client |
| `src/repositories/sqlite-job-repository.ts` | `JobRepository` implementation on SQLite |
| `src/services/follow-ups.ts` | creates or closes follow-up reminders when a status changes |
| `src/notifications/schedule.ts` | permission flow and rescheduling that respects the iOS ~64 notification limit |
| `src/repo-context.tsx` | provides the repository to screens (swap SQLite for the API in Stage 2 without touching screens) |
| `app/` | Expo Router screens: job list, add form, job details |
| `app.config.example.ts` | example Expo config with the notification and share-intent plugins |

## What is not verified

This code was written without running it on a device and without installing dependencies (the environment it was prepared in had no network).
Expect small fixes for the current versions of Expo SDK, `expo-notifications`, `expo-share-intent` and Drizzle.
The logic in `packages/shared` is covered by tests; this layer is not. The first repository tests on real SQLite are Day 6's task.

## Share extension (Day 10)

The `expo-share-intent` library is already listed in `app.config.example.ts`. Check its README for the `useShareIntent` hook API for your SDK
version, and pass the result to the `/add` screen through the `url` and `text` params.

## UI language

Visible strings are currently Ukrainian and hard-coded. Day 14 moves them to i18n files (uk/en).
