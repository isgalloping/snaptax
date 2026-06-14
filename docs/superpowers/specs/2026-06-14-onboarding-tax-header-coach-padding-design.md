# Onboarding Tax Header — Coach Padding Design

**Date:** 2026-06-14  
**Status:** Approved  
**Amends:** [`2026-06-14-onboarding-aha-coach-highlights-design.md`](./2026-06-14-onboarding-aha-coach-highlights-design.md) §3 Tax saved block

**Brainstorming approved:** 2026-06-14 — Option A (inner padding); coach-only; TaxHeader scope.

---

## 1. Problem

During `stage_aha`, the tax-saved coach halo uses `w-fit` with `CoachPulseOverlay` at `inset-0`. The yellow border hugs all three text lines with no breathing room; the subtitle (`1 receipt • $X tracked`) feels crushed against the ring bottom edge. Demo receipt cards already have `p-3`, so the tax block looks comparatively cramped.

---

## 2. Decision

| Topic | Choice |
|-------|--------|
| Fix approach | **A — inner padding** on coach wrapper |
| Active when | `ahaCoachActive === true` only |
| Padding | `px-2.5 py-2` (~10px horizontal, ~8px vertical) |
| Width | Keep `w-fit max-w-full` on inner wrapper; outer `min-w-0 flex-1 pr-3` unchanged |
| Overlay | Reuse `CoachPulseOverlay` default variant; no CSS changes |
| Scope | `TaxHeader.tsx` tax-saved block only |

---

## 3. Layout

```text
outer: min-w-0 flex-1 pr-3          ← flex placeholder, keeps Export gap
inner: relative w-fit max-w-full
       + px-2.5 py-2 (coach only)
       + rounded-xl + CoachPulseOverlay inset-0
       └─ title / amount / subtitle
```

Non-coach states: inner wrapper has **no** extra padding — layout identical to pre-coach baseline.

---

## 4. Unchanged

- Export button halo (`CoachPulseOverlay variant="export"`)
- Receipt list demo card halo
- SNAP focus ring
- `snap-coach-heartbeat` / `prefers-reduced-motion` behavior
- Tap tax stats → `dismissAhaCoach` / `completed` flow

---

## 5. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-P1 | In `stage_aha`, visible gap between yellow ring and all three text lines |
| AC-P2 | Ring does not overlap or crowd the Export download button |
| AC-P3 | When `ahaCoachActive` is false, tax header spacing matches pre-change layout |
| AC-P4 | Tax stats remain tappable for coach dismiss |
| AC-P5 | No changes to other coach zones (receipt card, export) |

---

## 6. Files

| File | Change |
|------|--------|
| `components/home/TaxHeader.tsx` | Add coach-only `px-2.5 py-2` to inner tax-stats wrapper |
