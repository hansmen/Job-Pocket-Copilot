# Job Copilot

An AI-assisted job-search companion for developers: save job postings, get follow-up reminders, parse postings with AI,
tailor your resume and prepare for interviews. A mobile app (Expo / React Native) and a web client share one API.

> Status: **Stage 0, day one.** This repository is the foundation, not a finished app. Start with
> [docs/00-START-HERE.md](docs/00-START-HERE.md).

## Repository layout

```
apps/
  api/            NestJS + Prisma + Postgres (skeleton for Stage 2)
  mobile/         created by scripts/bootstrap-mobile.sh (Day 2)
  web/            Next.js, Stage 4
packages/
  shared/         pure logic + zod schemas + the repository interface (tested)
scaffold/mobile/  starter mobile code: DB schema, repository, notifications, screens
golden-set/       sample postings + eval script for the AI parser
docs/             vision, architecture, day-by-day roadmap, AI guidelines, security, devlog
scripts/          setup, mobile bootstrap, GitHub issues from the backlog
.claude/commands/ Claude Code slash commands (/next-task, /review)
```

## Quick start

```bash
nvm use                         # Node 22 (see .nvmrc)
corepack enable                 # pnpm
./scripts/setup.sh              # install, build shared, run tests, start Postgres (if Docker is present)
pnpm --filter @jc/shared test   # 28 tests for the core logic
node golden-set/eval.mjs        # baseline parser score on the golden set (0.774)
```

## Commands

| Command | What it does |
| --- | --- |
| `pnpm lint` / `typecheck` / `test` | checks across the monorepo |
| `pnpm db:up` / `db:down` | Postgres in Docker |
| `pnpm issues:dry` / `pnpm issues` | preview / create GitHub issues from `scripts/backlog.json` (needs the `gh` CLI) |
| `./scripts/bootstrap-mobile.sh` | create `apps/mobile` and overlay the scaffold |
| `node golden-set/eval.mjs` | score a parser against the golden set |

## Principles

AI never invents facts · user data belongs to the user · business logic lives only in `packages/shared` ·
every AI call has a limit, a cache and a cost record. Details: [docs/01-vision.md](docs/01-vision.md).

## What is verified and what is not

Verified in the environment where this starter was prepared: the 28 tests of `@jc/shared`, the golden-set eval script and the issues
script (`--dry-run`). **Not verified** (no network to install dependencies, no device): the NestJS skeleton, the mobile scaffold and the
bootstrap script. Expect small fixes for current library versions. The full list is in [docs/10-known-gaps.md](docs/10-known-gaps.md).

## License

No license is set yet. Add one before making the repository public (MIT is a common choice for a portfolio project).
