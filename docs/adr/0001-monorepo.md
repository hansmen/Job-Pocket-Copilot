# ADR 0001: Monorepo (pnpm + Turborepo)

**Status:** accepted · **Date:** 2026-11-16

**Context.** The mobile app, the web client and the API must share types, schemas and status rules.

**Decision.** One repository: `apps/*` and `packages/*`, pnpm workspaces, Turborepo for tasks.

**Consequences.** Pros: shared code without publishing packages, one CI. Cons: configuring Metro/Nest for workspace packages, a bigger repository.
If it gets tight we can split; the shared packages are already isolated.
