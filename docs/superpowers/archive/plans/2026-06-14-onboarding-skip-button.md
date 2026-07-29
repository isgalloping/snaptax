# Onboarding Skip Button — Implementation Plan

> **For agent:** Per [`2026-06-14-onboarding-skip-button-design.md`](../specs/2026-06-14-onboarding-skip-button-design.md).

**Goal:** Bottom-left Skip exits any `stage_*` onboarding immediately into normal app flow.

---

## Task 1: `skipOnboarding()` helper

**File:** `lib/onboarding/skipOnboarding.ts`

- [x] Delete `onboarding-demo-receipt` (receipt + photo via `deleteReceipt`)
- [x] `setOnboardingStatus("completed")`

## Task 2: Flow hook + button

**Files:** `useOnboardingFlow.ts`, `OnboardingSkipButton.tsx`

- [x] `skipOnboardingFlow` — clear override, call helper, refresh list
- [x] Fixed `z-[60]` bottom-left button with i18n `Skip`

## Task 3: Mount

**Files:** `HomeScreen.tsx`, `OfflineHomeShell.tsx`

- [x] Render when `onboardingInFlow`

## Task 4: i18n

**Files:** `en-US.ts`, `fr-FR.ts`, `de-DE.ts`, `types.ts`

- [x] `onboarding.skip`, `onboarding.skipAria`

## Verify

- [ ] `npm run test:unit`
- [ ] Manual: skip from `stage_1`, `stage_2`, `stage_aha`
