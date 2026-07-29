# Onboarding Demo Receipt Repair — Design

**Date:** 2026-06-14  
**Status:** Approved  
**Amends:** [`2026-06-14-onboarding-stage-aha-sample-export-design.md`](./2026-06-14-onboarding-stage-aha-sample-export-design.md) §4 Sample export

**Brainstorming approved:** 2026-06-14 — Option A (self-heal + resilient export).

---

## 1. Problem

Users can reach `stage_3` / `stage_aha` with tax header showing $28.50 while the onboarding demo receipt remains `processing` ("Pending Test"). Export in `stage_aha` silently no-ops because `handleExportClick` requires `demo.status === "done"`.

**Causes:** refresh/race during sandbox save; list stale after complete; status advanced before IndexedDB write visible.

---

## 2. Decision

| Topic | Choice |
|-------|--------|
| Strategy | **A — self-heal + resilient export** |
| Helper | `ensureOnboardingDemoDone()` in `demoReceipt.ts` |
| Repair triggers | `stage_3` entry (orchestrator); init when `stage_3`/`stage_aha`; export click |
| Export scope | `stage_3` **or** `stage_aha` → sample CSV → `completed` |
| Idempotent | Already `done` → no-op write |

---

## 3. `ensureOnboardingDemoDone()`

1. Load `onboarding-demo-receipt`
2. Missing → `createShadowDemoReceipt()`
3. `processing` → `completeDemoReceipt()` + `saveReceipt`
4. Return done receipt

---

## 4. Integration

| Location | Behavior |
|----------|----------|
| `OnboardingOrchestrator` | On `stage_3`: repair + refresh **before** Aha timers / `stage_aha` transition |
| `ensureOnboardingInitialized` | If status `stage_3` or `stage_aha`: repair on boot |
| `HomeScreen.handleExportClick` | `stage_3`/`stage_aha`: repair → refresh → download → `completed` |

---

## 5. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-R1 | After sandbox shutter, demo shows COMPLETE / READY tab |
| AC-R2 | Export in `stage_aha` downloads sample CSV |
| AC-R3 | Reload with stale processing demo + `stage_aha` auto-repairs |
| AC-R4 | Export during brief `stage_3` also downloads sample |
| AC-R5 | Post-`completed` export unchanged (normal gate) |

---

## 6. Files

| File | Change |
|------|--------|
| `lib/onboarding/demoReceipt.ts` | `ensureOnboardingDemoDone()` |
| `lib/onboarding/demoReceipt.test.ts` | Tests for helper logic |
| `lib/onboarding/onboardingState.ts` | Repair on init |
| `components/onboarding/OnboardingOrchestrator.tsx` | Repair before Aha |
| `components/home/HomeScreen.tsx` | Resilient export handler |
