Review the current changes (git diff) against this checklist:

- Do they respect the principles in docs/01-vision.md (AI never invents facts, user data belongs to the user)?
- Does business logic live in packages/shared rather than in the UI?
- Is there a test for the new logic?
- Are there any secrets or personal data in code or logs?
- Do AI calls have a limit, a cache and output validation?

Give a list of findings ordered by importance. Do not change anything without my permission.
