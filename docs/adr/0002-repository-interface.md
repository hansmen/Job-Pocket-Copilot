# ADR 0002: The UI works through JobRepository

**Status:** accepted · **Date:** 2026-11-16

**Context.** The app starts local-only (SQLite), then syncs with a server, then gets a web client.

**Decision.** A `JobRepository` interface in `packages/shared`. Screens know nothing about SQLite or HTTP; the implementation is supplied through context.

**Consequences.** Moving to the API does not touch the screens. Logic can be tested with a fake repository. Cost: a bit more code up front.
