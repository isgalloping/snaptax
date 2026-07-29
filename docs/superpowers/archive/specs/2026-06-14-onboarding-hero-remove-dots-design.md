# Onboarding Hero — Remove Carousel Dots Design

**Date:** 2026-06-14  
**Status:** Approved  
**Amends:** [`2026-06-14-onboarding-hero-auto-advance-design.md`](./2026-06-14-onboarding-hero-auto-advance-design.md) §2 Dots above CTA

**Brainstorming approved:** 2026-06-14 — remove decorative 3-dot carousel above Let's Go on Hero only.

---

## 1. Problem

Hero mockup red-box area shows three carousel dots (yellow + grey) between the checklist and CTA. Product no longer wants this decorative indicator — countdown on the button is sufficient progress feedback.

---

## 2. Decisions

| Topic | Choice |
|-------|--------|
| Scope | **HeroWelcomeLanding only** |
| Dots above CTA | **Remove** |
| Dots below CTA | Already absent (unchanged) |
| Spacing | Add `mb-6` on checklist `ul` to preserve checklist→button gap |
| Timing / countdown | Unchanged (5s dwell, 1.5s early tap) |

---

## 3. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-RD1 | Hero page shows no dots between checklist and Let's Go |
| AC-RD2 | Checklist and button spacing remains comfortable |
| AC-RD3 | Countdown, 5s auto-advance, 1.5s early tap unchanged |

---

## 4. Files

| File | Change |
|------|--------|
| `components/landing/HeroWelcomeLanding.tsx` | Delete dots `div`; `mb-6` on checklist |
