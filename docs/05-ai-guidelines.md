# AI: rules, prompts, evaluation, cost

## The LlmClient layer

All AI goes through `apps/api/src/llm/llm-client.ts`. This allows swapping providers, a `FakeLlmClient` in tests and unified accounting.
A request always has: `feature`, `tier` (`fast` / `strong`), `system`, `userContent` and `schema` (zod). The response is validated against
the schema; on invalid JSON retry once or twice, then fail.

## Untrusted data

Job and resume text is **data**, not instructions:

- it is always passed in `userContent` and never interpolated into `system`;
- the model has no tools (it calls nothing and does not follow links);
- output is validated against a schema; free-text fields are never interpreted as commands;
- the prompt contains an explicit rule to ignore instructions inside the text.

The golden set includes a prompt-injection sample (`04-lead-mobile-injection`) to check this.

## Job parsing

- Schema: `ParsedJobSchema` (`packages/shared/src/schemas.ts`). Prompt: `apps/api/src/llm/prompts/parse-job.ts`.
- `tier = fast` (cheaper model). Cache by SHA-256 of the normalized text plus the parser version.
- Do not invent: not in the text -> `null` / `unknown` / `[]`.
- Screenshots: the same result via vision; if the text is unreadable, return an error instead of guessing.

## Resume tailoring (Stage 2C)

Hard rules:

1. The source of truth is the **user's profile** (the structured resume they confirmed).
2. Every suggested change carries a `sourceRef`: which profile line it is based on. Without a `sourceRef` it is `needs_confirmation` and does not enter a PDF automatically.
3. Allowed: rephrase, reorder, highlight what is relevant, pick keywords from the posting **that are already supported by the user's experience**.
4. Not allowed: add technologies, positions, dates or metrics that are not in the profile.
5. The user sees a diff and accepts or rejects each change.

## Interview prep (Stage 3)

Rubric (score 1-5 with an explanation and a quote from the user's answer):

- **Structure:** context -> action -> result (STAR or similar).
- **Specificity:** numbers, names, scale, not generalities.
- **Fit to the posting:** does it touch the requirements from the parsed posting.
- **Language (English):** clarity and typical mistakes; no claims about "B2/C1 level".

Feedback contains: strengths, 2-3 priority improvements, and a rewritten answer built **only from the user's own facts**.

## Evals

- `golden-set/`: postings plus expected JSON. Run: `node golden-set/eval.mjs [--dir ...] [--parser ./my-parser.mjs] [--save]`.
- Metrics: exact match for title, company, seniority, work mode and salary; F1 for the `stack` list.
- Rule: a prompt or model changes only with a before/after comparison on the golden set. Keep results in `golden-set/results/`.
- Add every real case where parsing went wrong to the golden set (anonymized).
- Do not let the model label its own test set; label by hand.

## Cost and limits

- Record provider calls and cache hits in `AiUsage` (tokens, cost, `cached`).
- Enforce `AI_DAILY_CALLS_PER_USER` per user. `AI_MONTHLY_BUDGET_USD` is a service-wide stop for new calls based on reported spend; a final or concurrent provider call can exceed it because its actual cost is not known in advance.
- `LLM_PROVIDER=fake` is a test stub: it makes no external request, costs nothing, and only returns queued test data. It does not parse real postings.
- Pick the model by task: parsing is `fast`, rewriting and feedback are `strong`.
- Voice (Stage 3): calculate the cost of a 15-minute session (STT + LLM + TTS) before launch and set a minutes limit.
- Never log job or resume text; in logs keep only id, feature, model, tokens.

## Prompt versioning

Every prompt has a version (`parse-job@1`). Change the text -> bump the version. The version is stored with the record (`Job.parserVersion`),
so old records can be recomputed and quality compared.
