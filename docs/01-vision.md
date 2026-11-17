# Vision

## In one sentence

A mobile (and later web) assistant where a job posting from any site gets into the app in 20 seconds, turns into a structured record with a
match analysis against your profile, and is then followed up with reminders, a tailored resume and interview preparation specific to that posting.

## Who it is for

**Primary user:** a developer or adjacent specialist who is job hunting (especially for English-speaking companies, from a Ukrainian or
Eastern European context) and applies to 10-50 places at once.

**First user:** the author. Their own job search provides the first data and the first pains.

## Initial user stories

1. I see a posting on LinkedIn / DOU / Djinni, share it to the app, and it is saved without manual typing.
2. I apply, change the status, and the app schedules a follow-up reminder for me.
3. A week later I get the reminder, write to the recruiter and note it in the history.
4. I want to see how many applications are at which stage and where I get stuck.
5. (Stage 2) I want to understand how my profile differs from the posting's requirements.
6. (Stage 2) I want to tailor my resume to a posting and see every change, so nothing untrue is added.
7. (Stage 3) I want to practice for an interview for this specific posting and see where I am weak.

## Principles

1. **For myself first.** If the author does not use a feature, it is not needed.
2. **AI helps but does not invent.** No fact reaches a resume without a source in the user's profile.
3. **The user owns their data.** Export and deletion work from the first release; offline by default.
4. **API-first.** One backend serves mobile, web and future clients.
5. **Predictable costs.** Every AI call has a limit, a cache and accounting.
6. **Small steps.** A stage is finished only after a week of real use.

## What we do not do

- Auto-apply or send messages on the user's behalf.
- Mass scraping of job sites. We work with text, screenshots and links the user supplies.
- Promise "passes any ATS" or give an official English level assessment.
- Give medical, legal or financial advice.

## How we might differ from Teal, Huntr and others

- **Mobile-first via the Share sheet** (most competitors are browser extensions).
- **Local-first and private:** data stays on the device; only what is needed goes to the cloud.
- **Ukrainian / Eastern European context:** DOU, Djinni, language, salary ranges in dollars.
- **One loop:** posting -> gaps -> practice -> interview -> feedback in one place.

These are hypotheses; we test them in `docs/07-user-research.md`.

## How we know it works

The metrics per stage: time to add a posting, share of completed follow-ups, parsing accuracy, share of resume changes with a verified
source, AI cost per user, day-7 return. Starting targets are in the planning document and are revisited after every stage.
