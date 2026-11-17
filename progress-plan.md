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
  - Notes: non-blocking lint warnings remain in `apps/api`, but no errors and no failing checks
- [~] Day 2. The mobile app on a phone
  - Expo project generated (SDK 58) and scaffold overlaid
  - Fixed the bootstrap script for Expo's `src/` starter layout
  - Initial Drizzle SQLite migration generated
  - Expo display name is Job Pocket Copilot; iOS and Android IDs are `com.jobpocketcopilot.mobile`
  - Expo development client installed
  - Android/iOS bundle exports and mobile TypeScript check passed
  - [!] Real-device build and opening the empty Jobs list deferred until continuing on macOS
- [ ] Day 3. Monitoring and the golden set
  - Goal: Sentry + baseline evaluation score
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

- [ ] API foundation
- [ ] Sync
- [ ] AI job parsing
- [ ] Profile and match
- [ ] Resume tailoring

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

### This session

- [x] Confirm roadmap day
- [x] Install missing tooling
- [x] Install repo dependencies
- [x] Validate shared tests
- [x] Run full validation chain
- [x] Move to Day 2 tasks

### Next action items

- [x] Bootstrap mobile app
- [x] Review and fix `scripts/bootstrap-mobile.sh`
- [x] Merge app config values and set the app identifier
- [!] Prepare environment for real-device build
  - Resume on macOS to build/run on an iPhone; this Windows machine has no iOS build tools
  - Next: run `npx expo run:ios` from `apps/mobile` with Xcode and the phone/simulator available
- [x] Check whether Expo/phone build dependencies are available locally
  - Git Bash is available; Android `adb` and iOS `xcrun` are not on this Windows machine

---

## Notes

- Day 1 is complete and satisfies the roadmap criterion.
- Day 2 setup and bundle validation are complete, but the roadmap's real-phone criterion is still pending.
- Continue Day 2 on macOS: build the dev app, launch it on the phone, and verify the empty Jobs list opens.
- Keep this file updated after each milestone; use `[!]` for blocked or deferred items.
