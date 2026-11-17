# ADR 0004: We do not fetch job pages by URL

**Status:** accepted · **Date:** 2026-11-16

**Context.** Scraping violates the terms of many sites, breaks when blocked and creates SSRF risk.

**Decision.** A posting's sources are text the user pasted or shared, and a screenshot. A URL is stored as a link and is not fetched automatically.

**Consequences.** Slightly less "magic", far less risk. If we ever add fetching, it will be public pages only, through an allowlist,
with SSRF protection and a separate ADR.
