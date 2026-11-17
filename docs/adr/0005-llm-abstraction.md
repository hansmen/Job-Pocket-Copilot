# ADR 0005: A single LlmClient layer

**Status:** accepted · **Date:** 2026-11-16

**Context.** Providers, models and prices change; costs and safety must stay under control.

**Decision.** All calls go through the `LlmClient` interface with a mandatory zod schema, `AiUsage` accounting, limits and a cache.
Untrusted data goes only in `userContent`. Tests use `FakeLlmClient`.

**Consequences.** Switching providers is local. Evals (the golden set) can run against any provider.
An extra layer of code, but predictable costs and less chance of sending data without accounting.
