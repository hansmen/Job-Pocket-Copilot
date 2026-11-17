# Release checklist

## Before internal testing (TestFlight / Internal testing)

- [ ] `pnpm lint && pnpm typecheck && pnpm test` are green
- [ ] Version and build number are bumped
- [ ] Sentry receives errors from the build, source maps are uploaded
- [ ] Reminders, the share extension and export are verified on a real device
- [ ] Icon, splash, name and bundle id / package are final

## Before the closed beta (20-50 people)

- [ ] Privacy policy and terms of use are published (URLs in the stores)
- [ ] Data export and deletion work
- [ ] No personal data in logs or Sentry
- [ ] AI limits and the budget are enabled, with an alert on overrun
- [ ] Sandbox payments pass on iOS and Android
- [ ] The golden set was run after the last prompt change and the result saved
- [ ] A feedback channel exists for beta users

## Before the public release

- [ ] App Store: privacy labels, screenshots, description, keywords (ASO), age rating
- [ ] Google Play: Data safety, screenshots, description, a test account for review
- [ ] AI use is stated honestly in the description and policy
- [ ] No third-party names, logos or style are used
- [ ] Plans and limits are described transparently; cancelling a subscription is clear
- [ ] A rollback plan: how to switch off AI features quickly (feature flag)
- [ ] A launch post and a devlog episode with links

## After the release (first week)

- [ ] Check Sentry and AI spend every day
- [ ] Answer store reviews
- [ ] Collect the first metrics (D1/D7, activation, time to add a job)
- [ ] Retrospective and backlog update
