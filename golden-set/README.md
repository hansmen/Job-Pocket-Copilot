# Golden set

A small set of job postings with the expected structured result. It answers one question: **did the parser get better or worse after my last change?**

## Contents

- `samples/*.json`: 8 **synthetic** postings (invented companies, no real data). They cover clean postings, hybrid/on-site/remote, three currencies, a yearly salary, a prompt-injection attempt, a vague posting, informal phrasing and a Ukrainian-language posting.
- `eval.mjs`: runs a parser over the samples and prints per-field scores.
- `results/`: reports written by `--save` (create it with the first run; commit the ones worth keeping).
- `private/`: **git-ignored**. Put your real, anonymized postings here (see below).

## Run

```bash
node golden-set/eval.mjs                          # built-in baseline (regex) parser
node golden-set/eval.mjs --dir golden-set/private # your real postings
node golden-set/eval.mjs --parser ./my-parser.mjs # your own parser
node golden-set/eval.mjs --save                   # write a JSON report to results/
node golden-set/eval.mjs --threshold 0.9          # exit 1 if the overall score is below 0.9
```

The baseline currently scores **0.774** on the synthetic set (title 0.88, company 0.63, seniority 0.75, work mode 0.75, salary 0.75, stack 0.90). It is deliberately naive: it fails on informal phrasing, non-English postings and salaries written as "up to 4.5k". The AI parser from Stage 2 must beat it.

## Sample format

```json
{
  "id": "01-senior-rn-remote",
  "text": "…the posting text…",
  "expected": {
    "title": "Senior React Native Developer",
    "company": "Acme Mobile",
    "seniority": "senior",
    "workMode": "remote",
    "salary": { "min": 5000, "max": 7000, "currency": "USD", "period": "month" },
    "stack": ["React Native", "TypeScript"]
  }
}
```

`seniority` is one of `intern | junior | middle | senior | lead | unknown`; `workMode` is one of `remote | hybrid | onsite | unknown`; `salary` is `null` when the posting gives none. Unknown or missing values must be `null` / `"unknown"` / `[]`, never guessed.

## Metrics

| Field                               | How it is scored                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| title, company, seniority, workMode | exact match after trim + lowercase                                               |
| salary                              | the whole object must match (`min`, `max`, `currency`, `period`), or both `null` |
| stack                               | F1 between predicted and expected lists (case-insensitive)                       |

The overall score is the mean of the six field means.

## Writing a parser module

```js
// my-parser.mjs
export default async function parse(text) {
  // call your parser / API client here
  return { title, company, seniority, workMode, salary, stack };
}
```

For the real AI parser, write a small adapter that calls the API's parse endpoint (or `LlmClient`) and returns the `ParsedJob` shape from `packages/shared`.

## Build your private set (Day 3)

1. Collect 10 real postings you saw while job hunting (text, plus a few as screenshots for the vision step later).
2. Remove anything personal: recruiter names, emails, phone numbers, internal links.
3. Save each as `golden-set/private/NN-name.json` using the format above, with the `expected` block filled in by hand. Do the labeling yourself; do not ask the model to label its own test set.
4. Run `node golden-set/eval.mjs --dir golden-set/private` and record the baseline score in your devlog.

## Rules

- Change a prompt or model **only** with a before/after comparison on this set.
- Every time the parser gets a real posting wrong, add that posting (anonymized) to the set.
- Never put real postings with personal data into `samples/` or any public repository.
