# Tax Header Coach Padding — Implementation Plan

> **For agent:** Single-file change per [`2026-06-14-onboarding-tax-header-coach-padding-design.md`](../specs/2026-06-14-onboarding-tax-header-coach-padding-design.md).

**Goal:** Add coach-only inner padding so the tax-saved halo does not crush the subtitle.

---

## Task 1: TaxHeader padding

**File:** `components/home/TaxHeader.tsx`

- [ ] **Step 1:** When `ahaCoachActive`, add `px-2.5 py-2` to the inner `w-fit` wrapper (same element that has `rounded-xl` and `CoachPulseOverlay`).

**Verify:** Refresh app in `stage_aha` — ring has breathing room; Export unchanged; non-coach layout unchanged.
