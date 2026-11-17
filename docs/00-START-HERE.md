# Where to start

The first hour of Day 1. Do not improvise, just follow the list.

## 0. Before you start (15 min)

- [ ] Create a **private** GitHub repository (`job-pocket-copilot`). Make it public later, once you are sure the history contains no secrets.
- [ ] Check that you have: Node 22, pnpm (`corepack enable`), Git, Docker Desktop, Xcode + Command Line Tools, Android Studio.
- [ ] Decide on an Apple Developer account: it is needed for TestFlight and for running the share extension on a physical iPhone.
      It costs roughly 99 USD per year (check the current price on Apple's site). You do not need it for Days 1-4.

## 1. First hour of Day 1

1. Unpack the project, `cd` into it, `git init`, make the first commit, push to your repository.
2. `./scripts/setup.sh`. Expected: dependencies installed, 28 tests green.
3. `node golden-set/eval.mjs`. This is the naive baseline parser; it scores 0.774 on the synthetic set. Write the number down: the AI parser must beat it in Stage 2.
4. Open `docs/03-roadmap.md`, Day 1, and work through it.
5. Optional: `pnpm issues:dry`, then `pnpm issues` to create all roadmap items as GitHub issues (needs the `gh` CLI and `gh auth login`).
6. Record the first devlog episode (template in `docs/08-devlog-youtube.md`), even 3 minutes: "what I am building and why".

## 2. Ground rules

- **2 hours a day**, no more. If a day does not close, carry the remainder over; do not add hours.
- One day = one goal with a "Done when" criterion. Do not start the next day until the criterion is met.
- This project does not replace job applications: keep a separate daily time limit for applying.
- Anything outside the current day goes into `scripts/backlog.json` or your notes, not into code.

## 3. If you get stuck

1. Write down what you expected and what happened (3 lines).
2. Ask Claude Code: `/next-task`, or describe the problem and paste the log.
3. If it is not solved in 30 minutes, move to the next step that does not depend on it and come back tomorrow.

## 4. What is already in the repository

| Part | Status |
| --- | --- |
| `packages/shared` | written, 28 tests pass |
| `golden-set/` | 8 synthetic postings and `eval.mjs`; baseline score 0.774 |
| `scripts/create-issues.mjs` + `backlog.json` | 37 backlog items; validated and dry-run tested, not run against GitHub |
| `apps/api` | skeleton, never run (needs `pnpm install` and Postgres) |
| `scaffold/mobile` | starter code, never run |
| CI, issue/PR templates, `.claude/commands` | ready |

See [10-known-gaps.md](10-known-gaps.md) for exactly what is unverified.
