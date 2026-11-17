# Security and privacy

## Data

| What | Where it is stored | Note |
| --- | --- | --- |
| Jobs, applications, notes | locally (SQLite); from Stage 2 also the server | export and deletion from the first release |
| Resume / profile | server (Stage 2) | contents are not logged |
| Screenshots, files | S3-compatible storage, signed URLs | deleted with the account |
| Interview audio (Stage 3) | not stored by default | we keep the transcript; audio only with separate consent |
| AI requests | AI provider | check its retention / training-on-data policy before launch |

## Rules

- Secrets only in `.env` (git-ignored); `.env.example` has no values.
- Logs and Sentry: no job text, resume text, notes or email. Configure `beforeSend` to strip data.
- API: all routes are protected by default (`AuthGuard`); public ones are marked `@Public()`.
- `AUTH_MODE=dev` is for local use only: the guard refuses it when `NODE_ENV=production`.
- Signed URLs with a short lifetime; file size and type are limited.
- Account deletion removes DB rows, files in storage and caches.
- Rate limiting on AI endpoints.

## Threats we account for

- **Prompt injection in job/resume text:** see `docs/05-ai-guidelines.md`.
- **SSRF** when fetching pages by URL: we do not fetch pages by default (ADR 0004).
- **Data leaks through logs and analytics:** see above.
- **Invented AI facts in user documents:** the `sourceRef` rule.
- **Cost abuse:** limits and a budget.

## Legal (verify before a public launch)

- A privacy policy and terms of use.
- A GDPR-style approach even without EU jurisdiction: consent, export, deletion, minimization.
- App Store privacy labels / Google Play Data safety: state the AI processing honestly.
- Job sites' terms of use: we do not scrape; we work with what the user provides.
- Gmail / Calendar APIs: restricted scopes may require Google verification; check the current requirements before designing the integration.
- Payments outside the app stores: Apple/Google rules differ by region; check before launching web subscriptions.

This is a checklist of things to verify, not legal advice.
