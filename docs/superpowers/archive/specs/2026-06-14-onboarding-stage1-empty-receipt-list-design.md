# Onboarding Stage 1 — Empty Receipt List Design

**Date:** 2026-06-14  
**Status:** Approved  
**Amends:** [`2026-06-13-aha-moment-onboarding-design.md`](./2026-06-13-aha-moment-onboarding-design.md) §3.1 Stage 1 Shadow

**Brainstorming approved:** 2026-06-14 — Option C (delay IDB + UI filter); empty until sandbox shutter.

---

## 1. Problem

`stage_1` injects a shadow demo receipt (`SAMPLE: BUILDER DEPOT`, Pending Test) into the list. Users see **1 receipt** before taking any photo, conflicting with「先空列表、拍完再出现价值」.

---

## 2. Decision

| Topic | Choice |
|-------|--------|
| `stage_1` list | **Empty** — no cards, tab counts 0 |
| `stage_1` header | `0 receipt` · `$0.00 tracked` |
| IDB at `stage_1` | **No** shadow demo seed |
| First demo appearance | Sandbox shutter → `ensureOnboardingDemoDone()` → COMPLETE card |
| Safety belt | UI filter hides `isOnboardingDemo && processing` when `stage_1` |
| Legacy IDB shadow | Remove processing demo on `stage_1` init when found |

---

## 3. Lifecycle

```text
stage_1     → no demo in IDB; list empty; SNAP coach only
stage_2     → sandbox fullscreen; list still empty (behind sheet)
shutter     → demo created + completed → list shows COMPLETE sample
stage_3+    → unchanged
```

---

## 4. Implementation

| Unit | Change |
|------|--------|
| `ensureDemoReceiptPresent` | Skip when `stage_1` |
| `commitHeroLandingStart` | Only `setOnboardingStatus("stage_1")`; purge stale processing demo |
| `ensureOnboardingInitialized` | Legacy `stage_1` path without shadow seed; purge on `stage_1` |
| `visibleReceiptsForOnboarding()` | Filter processing demo in `stage_1` |
| `HomeScreen` / `OfflineHomeShell` | List + header stats use filtered receipts |

---

## 5. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-E1 | `stage_1` receipt list empty; tabs show 0 |
| AC-E2 | Tax header shows 0 receipts / $0 tracked |
| AC-E3 | After sandbox shutter, COMPLETE sample appears |
| AC-E4 | Existing users with stale shadow at `stage_1` see empty list |
| AC-E5 | Post-`stage_2` Aha / coach / export unchanged |

---

## 6. Files

| File | Change |
|------|--------|
| `lib/onboarding/onboardingReceipts.ts` | New filter helper |
| `lib/onboarding/onboardingState.ts` | Defer seed; purge shadow |
| `components/home/HomeScreen.tsx` | Filtered display receipts |
| `components/home/OfflineHomeShell.tsx` | Filtered display receipts |
