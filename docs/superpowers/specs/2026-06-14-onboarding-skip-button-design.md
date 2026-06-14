# Onboarding Skip Button — Design

**Date:** 2026-06-14  
**Status:** Approved  
**Amends:** [`2026-06-13-aha-moment-onboarding-design.md`](./2026-06-13-aha-moment-onboarding-design.md) §3 layered user flow

**Brainstorming approved:** 2026-06-14 — delete demo receipt; one-tap skip; fixed bottom-left; any `stage_*`.

---

## 1. Problem

New users in the Aha onboarding path (`stage_1` → `stage_aha`) cannot exit the tutorial early. Some users want to start normal receipt capture immediately without completing the sandbox snap, coach halos, or sample export.

---

## 2. Decisions

| Topic | Choice |
|-------|--------|
| Placement | Bottom-left fixed (`bottom-4 left-4`), per user mockup red box |
| Z-index | `z-[60]` — above sandbox sheet (`z-50`) and snackbar (`z-50`) |
| Interaction | **One tap** — no confirmation modal/sheet |
| Demo receipt | **Delete** `onboarding-demo-receipt` + local photo |
| End state | `onboarding_status` → `completed` |
| Visible when | `isOnboardingActive(status)` — `stage_1` through `stage_aha` |
| Hidden when | `not_started`, `completed`, `deferred_login` |
| Architecture | `skipOnboarding()` in `lib/onboarding/` + `OnboardingSkipButton` component |
| i18n key | `onboarding.skip` → `"Skip"` |

---

## 3. Skip action (atomic)

On tap, in order:

1. Delete photo for `ONBOARDING_DEMO_RECEIPT_ID` (ignore if missing)
2. Delete receipt `ONBOARDING_DEMO_RECEIPT_ID` (ignore if missing)
3. `setOnboardingStatus("completed")` — IndexedDB + mirror
4. Client state: clear `taxDisplayOverride`, set status `completed`
5. `onRefreshReceipts()` — list + tax header reflect real data (typically empty / $0)

Side effects from status change:

- `OnboardingOrchestrator` unmounts → sandbox sheet closes, snackbar clears, stage timers cleaned up
- Coach halos, SnapTooltip, SnapFocusRing hidden
- SNAP uses real camera path (`resolveSnapIntent` returns `true`)
- Export uses normal `useTaxExportGate` (not sample CSV)

---

## 4. UI spec

```text
OnboardingSkipButton
  position: fixed bottom-4 left-4 z-[60]
  safe-area: padding-bottom env(safe-area-inset-bottom)
  touch: min-h-16 min-w-16 (≥64px per product rules)
  style: text-zinc-400 font-bold text-sm active:scale-95
  label: "Skip" (i18n)
  pointer-events: auto (must work over sandbox overlay)
```

Do **not** use yellow coach styling — Skip is a quiet escape hatch, not a primary CTA.

---

## 5. Mount points

| Screen | Condition |
|--------|-----------|
| `HomeScreen` | `onboardingInFlow === true` |
| `OfflineHomeShell` | `onboardingInFlow === true` |

Button receives `onSkip` from `useOnboardingFlow.skipOnboardingFlow`.

---

## 6. Unchanged

- Normal completion paths (sandbox → Aha → Export/dismiss → `completed`)
- Google soft/hard gates after onboarding
- Paddle paywall
- Hero landing / `not_started` → `stage_1` entry
- Demo receipt lifecycle when user **does not** skip

---

## 7. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-S1 | Skip visible in every `stage_*` including fullscreen sandbox (`stage_2`) |
| AC-S2 | One tap → `completed` with no intermediate dialog |
| AC-S3 | Demo receipt and photo removed from IndexedDB |
| AC-S4 | Tax header and list show post-skip real data (no $28.50 override) |
| AC-S5 | All coach UI gone; SNAP opens real capture |
| AC-S6 | Skip hidden after `completed` |
| AC-S7 | Skip hidden when `not_started` |

---

## 8. Files

| File | Change |
|------|--------|
| `lib/onboarding/skipOnboarding.ts` | New — delete demo + set `completed` |
| `lib/onboarding/skipOnboarding.test.ts` | New — unit tests |
| `components/onboarding/OnboardingSkipButton.tsx` | New — fixed bottom-left button |
| `components/onboarding/useOnboardingFlow.ts` | `skipOnboardingFlow` callback |
| `components/home/HomeScreen.tsx` | Mount button when `onboardingInFlow` |
| `components/home/OfflineHomeShell.tsx` | Mount button when `onboardingInFlow` |
| `lib/i18n/locales/en-US.ts` (+ other locales) | `onboarding.skip` |

---

## 9. Testing

- Unit: `skipOnboarding()` deletes demo id and writes `completed`
- Manual: skip from `stage_1`, `stage_2` (sandbox open), `stage_aha` — verify list empty, no halos, real SNAP
