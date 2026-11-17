# ADR 0003: Expo with dev builds, not Expo Go

**Status:** accepted · **Date:** 2026-11-16

**Context.** We need share extensions, native notifications, and later audio and payments.

**Decision.** Expo (managed + config plugins), developed in a dev build (`expo run:*` or EAS). We do not use Expo Go.

**Consequences.** The first build is slower; Xcode / Android Studio or EAS is required. In return there are no Expo Go limits and a smooth path to native
modules (Swift/Kotlin experience makes that easy).
