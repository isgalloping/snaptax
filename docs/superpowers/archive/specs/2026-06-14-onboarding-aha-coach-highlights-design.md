# Onboarding Stage 3–4 — Aha Coach Highlights Design

**Date:** 2026-06-14  
**Status:** Approved  
**Amends:** [`2026-06-13-aha-moment-onboarding-design.md`](./2026-06-13-aha-moment-onboarding-design.md) §6 Aha moment

**Brainstorming approved:** 2026-06-14 — `stage_3` + `stage_4`; dismiss all on any tap (C); Export visual weight boost.

---

## 1. Problem

After sandbox shutter, the odometer and snackbar prove $28.50 savings but users may miss **where** value landed (tax header, demo receipt, export path). Need heartbeat halos on three zones during Aha + signup, with Export as the visually dominant CTA.

---

## 2. Decisions

| Topic | Choice |
|-------|--------|
| Active stages | `stage_3` and `stage_4` |
| End | Google success / Later → `completed`; or user dismiss |
| Dismiss logic | **C** — tap tax stats, demo receipt card, or Export → **all** halos off |
| Export emphasis | Extra dark ring + brighter border + stronger pulse scale/glow |
| Animation | Reuse `snap-coach-heartbeat` / `.snap-focus-ring__pulse` |
| Persistence | Session state only (`ahaCoachDismissed`); not IndexedDB |
| Tax stats tap | Dismiss only; no navigation |

---

## 3. Target zones

| Zone | Component | Shape |
|------|-----------|-------|
| Tax saved block | `TaxHeader` left stats | `rounded-xl` |
| Demo receipt (done) | `ReceiptListCard` | `rounded-xl` |
| Export button | `TaxHeader` Download btn | `rounded-xl` + `--export` variant |

---

## 4. Export visual weight

Standard pulse on all three; Export additionally:

- `border-yellow-400` on button (vs `border-zinc-700` peers)
- `ring-2 ring-black/70` under pulse
- CSS variant `.snap-focus-ring__pulse--export`: scale peak **1.06**, +20% glow vs default

---

## 5. State

```typescript
// useOnboardingFlow
ahaCoachActive =
  (status === "stage_3" || status === "stage_4") && !ahaCoachDismissed;

// Reset dismissed when entering stage_3
dismissAhaCoach() => setAhaCoachDismissed(true);
```

---

## 6. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-A1 | Halos visible from `stage_3` through `stage_4` until dismiss or complete |
| AC-A2 | Any tap on three zones dismisses all halos |
| AC-A3 | Export visually strongest; still triggers existing export gate |
| AC-A4 | Odometer + snackbar unchanged |
| AC-A5 | `prefers-reduced-motion` static rings |
| AC-A6 | No halos after `completed` |

---

## 7. Files

| File | Change |
|------|--------|
| `useOnboardingFlow.ts` | `ahaCoachActive`, `dismissAhaCoach` |
| `TaxHeader.tsx` | Tax + Export overlays |
| `ReceiptListCard.tsx` | Demo done overlay |
| `ReceiptList.tsx` | Prop pass-through |
| `HomeScreen.tsx`, `OfflineHomeShell.tsx` | Wire props |
| `app/globals.css` | `--export` pulse variant |
