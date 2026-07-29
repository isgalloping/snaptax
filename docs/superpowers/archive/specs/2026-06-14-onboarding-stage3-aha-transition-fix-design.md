# Onboarding Stage 3 → Aha Transition Fix — Design

**Date:** 2026-06-14  
**Status:** Approved  
**Amends:** [`2026-06-14-onboarding-aha-coach-highlights-design.md`](./2026-06-14-onboarding-aha-coach-highlights-design.md) §5 State

**Brainstorming approved:** 2026-06-14 — Option A (stable callbacks + status-only effect).

---

## 1. Problem

After sandbox shutter, users return to main screen in `stage_3` (snackbar, $28.50, demo COMPLETE) but **never reach `stage_aha`**. Coach halos (tax block, demo card, Export) never appear — onboarding effects seem to "disappear."

**Root cause:** `OnboardingOrchestrator` `stage_3` effect depends on `onRefreshReceipts`. `HomeScreen` passes an inline async function recreated every render. List refresh after sandbox → parent re-render → effect cleanup sets `cancelled=true` and clears the 400ms `stage_aha` timer.

---

## 2. Decision

| Topic | Choice |
|-------|--------|
| Strategy | **A** — stable callbacks + status-only effect with ref guards |
| Callback stability | `useCallback` for `onRefreshReceipts` in `HomeScreen` / `OfflineHomeShell` |
| Effect deps | `[status]` only; handlers via refs |
| Duplicate run guard | `stage3SequenceStarted` ref per `stage_3` entry |
| Cleanup | Cancel timers only when leaving `stage_3` |

---

## 3. `OnboardingOrchestrator` sequence (unchanged timing)

On `status === "stage_3"` (once per entry):

1. `ensureOnboardingDemoDone()` + refresh receipts
2. Start tax animation + snackbar
3. After 400ms → `stage_aha`
4. After 600ms → stop tax animation

---

## 4. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-T1 | Within ~1s of sandbox shutter, coach halos visible (`stage_aha`) |
| AC-T2 | Re-render during `stage_3` does not cancel `stage_aha` transition |
| AC-T3 | Reload while `stage_3` in IDB still advances to `stage_aha` |
| AC-T4 | `stage_1` SNAP ring unchanged |

---

## 5. Files

| File | Change |
|------|--------|
| `components/onboarding/OnboardingOrchestrator.tsx` | Ref-based effect, `[status]` deps |
| `components/home/HomeScreen.tsx` | `useCallback` refresh handler |
| `components/home/OfflineHomeShell.tsx` | `useCallback` refresh handler |
