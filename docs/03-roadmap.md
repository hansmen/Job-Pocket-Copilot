# Roadmap, day by day

Assumption: about 2 hours a day, coding most days. **Day 1 is whichever day you start** (for example Tuesday 17 November 2026). If you miss a
day, shift everything; do not shrink the criteria. Every day ends with a "Done when" criterion.

Markers: **[devlog]** a good moment to record an episode · **[risk]** something to watch.

The same items exist as GitHub issues: `pnpm issues:dry` previews them, `pnpm issues` creates them (needs the `gh` CLI).

---

## Stage 0: foundation (Days 1-4)

### Day 1. Repository and environment

- Create a private GitHub repository, push the project, run `./scripts/setup.sh`.
- Confirm CI is green on GitHub.
- List what is still missing in Xcode / Android Studio and install it.
- **Done when:** `pnpm --filter @jc/shared test` is green locally and in CI. **[devlog]** intro episode.

### Day 2. The mobile app on a phone

- `./scripts/bootstrap-mobile.sh`; merge `app.config.example.ts` into the config and change the bundle id.
- Build a dev build (`npx expo run:ios` or EAS) and run it on a real phone.
- **Done when:** an empty "Jobs" list opens on the phone. **[risk]** the first native build can be slow.

### Day 3. Monitoring and the golden set

- Add Sentry (a test error arrives, PII scrubbed in `beforeSend`) and create EAS profiles (development, preview).
- Collect 10 real postings into `golden-set/private/` (outside git), anonymize them, label them by hand, then run
  `node golden-set/eval.mjs --dir golden-set/private`.
- **Done when:** Sentry shows the test event and you have a recorded baseline score. **[devlog]** "why a baseline score matters".

### Day 4. User research and sketches

- Send 5-10 messages to developers who are job hunting, using the script in `docs/07-user-research.md`.
- Sketch 5 screens on paper: list, details, add, reminders, settings.
- Create a simple waitlist page (Tally / Carrd) with an email field.
- **Done when:** 5+ messages sent, sketches exist, the waitlist link is live.

---

## Stage 1: local MVP (Days 5-21)

### Day 5. Database

- The generated Drizzle migration applies on start; verify the tables through a debug screen or logs.
- **Done when:** after an app restart the schema is in place with no errors.

### Day 6. Repository

- Wire up `SqliteJobRepository`; verify create/list/get/delete through a temporary debug screen.
- Make sure one `listJobs` call does not issue N queries.
- Add repository tests (Jest + SQLite).
- **Done when:** data survives a restart; deletes are soft (the row stays with `deletedAt`).

### Day 7. List and add screens

- Finish `app/index.tsx` and `app/add.tsx`: empty state, validation, duplicate check by normalized URL.
- **Done when:** you add 5 jobs manually; a duplicate URL (with utm params) warns.

### Day 8. Details and statuses

- Details screen: status changes only through allowed transitions, history and notes.
- Tests for the `syncFollowUp` scenario with a fake repository.
- **Done when:** an invalid transition is impossible in the UI and shows a clear message.

### Day 9. Reminders

- Notification permission, create a follow-up when moving to "Applied", reschedule on launch.
- For debugging: a temporary "remind in 1 minute" mode.
- **Done when:** a notification actually arrives on the phone. **[risk]** iOS keeps ~64 scheduled notifications: check `selectNotificationsToSchedule`.

### Day 10. Share extension (iOS)

- Configure `expo-share-intent`, accept a URL and text from Safari / LinkedIn / DOU.
- **Done when:** Share -> Job Pocket Copilot from Safari opens the add form with the URL. **[risk]** needs a dev build, not Expo Go.

### Day 11. Share (Android) and simple text parsing

- Android intent filter; use the first line of shared text as the title suggestion.
- **Done when:** the same flow works from Chrome on Android and the title is prefilled sensibly.

### Day 12. Filters, search, kanban

- Status filter, search, a simple kanban (horizontal columns).
- **Done when:** 30 test jobs filter without lag.

### Day 13. Export, import, settings

- Export JSON and CSV (share sheet), import JSON validated with `ExportBundleSchema`.
- Settings: follow-up delay in days, hour, skip weekends.
- **Done when:** export -> wipe data -> import restores everything.

### Day 14. Quality and accessibility

- Dark theme, uk/en localization (move UI strings to i18n files), error boundary, Sentry breadcrumbs, VoiceOver/TalkBack pass on the main screens.
- **Done when:** no unnoticed crash on any screen and fonts scale.

### Days 15-20. A week of real use (dogfooding)

- Use the app for real applications. Add no new features; fix bugs only.
- Keep `docs/pain-log.md`: what annoys you, what is missing, what you ignore.
- **Done when:** at least 10 real jobs are in the app and the pain log is filled in. **[devlog]** episode about the experience.

### Day 21. Stage 1 wrap-up

- Retrospective using the template in `docs/08-devlog-youtube.md`; update the backlog; internal TestFlight build.
- Check the metrics: add-a-job under 20 s, export works, reminders work.
- **Done when:** you have decided what goes into Stage 2, based on the pain log and not on assumptions.

---

## Stage 2: backend and AI (about weeks 4-8)

| Week | Goal              | Key tasks                                                                                      |
| ---- | ----------------- | ---------------------------------------------------------------------------------------------- |
| 4    | API foundation    | NestJS runs, Postgres + migrations, Firebase guard, `/jobs` CRUD, OpenAPI, client generation   |
| 5    | Sync              | API-backed `JobRepository`, outbox, first-login migration of local data, account deletion      |
| 6    | AI job parsing    | `LlmClient`, schema, cache, limits, `AiUsage`, evals on the golden set, screenshots (vision)   |
| 7    | Profile and match | Import resume into a structure, confirmation, comparison with a posting with source references |
| 8    | Resume tailoring  | Suggested changes as a diff, accept/reject, PDF export, cover letter                           |

**Done (Stage 2) when:** parsing accuracy on the golden set meets the threshold you chose, no resume change lacks a source,
data syncs between two devices, and limits and account deletion exist.

## Stage 3: interview prep (about weeks 9-12)

| Week | Goal                                                                                |
| ---- | ----------------------------------------------------------------------------------- |
| 9    | Questions per posting (text), rubric, JSON feedback                                 |
| 10   | Session history, repetition of weak questions                                       |
| 11   | Voice: recording, STT, reply, pauses and filler words; cost-per-session calculation |
| 12   | Weak-spot map and mini study plan; polish and Bluetooth device testing              |

## Stage 4: web, integrations, launch (about weeks 13-17)

| Week | Goal                                                                       |
| ---- | -------------------------------------------------------------------------- |
| 13   | Web (Next.js): sign-in, list, details, parsing                             |
| 14   | Web: resume editor; funnel analytics                                       |
| 15   | Recruiter email forwarding, subscriptions (RevenueCat + Stripe), AI limits |
| 16   | Closed beta with 20-50 people, collect feedback                            |
| 17   | Public release, ASO, launch post                                           |

Details, gotchas and risks for each stage are in the planning document and in `docs/05-ai-guidelines.md`,
`docs/06-security-privacy.md` and `docs/09-release-checklist.md`.
