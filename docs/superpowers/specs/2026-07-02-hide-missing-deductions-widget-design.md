# Hide Missing Deductions Widget — Design

**Date:** 2026-07-02  
**Status:** Approved (brainstorming)  
**Scope:** Hide the **Find More Savings** (`MissingDeductionsWidget`) from the home WidgetPager. Retain compute logic, overlays, and i18n for future re-enable.

**References:** `docs/superpowers/specs/2026-06-17-home-dashboard-redesign-design.md`, `docs/superpowers/specs/2026-06-18-home-widget-pager-design.md`

---

## Summary

Users see a green **Find More Savings** card (estimated tax from industry deduction hints) in the WidgetPager carousel. Product decision: **hide this card** on the home screen while Founder Program and other widgets remain. The feature is not deleted — only the pager slot is suppressed via a module constant.

---

## Decisions

| Topic | Choice |
|-------|--------|
| Hide scope | **Widget card only** (Option A) |
| Overlay / compute | **Keep** — `computeMissingDeductions`, `MissingDeductionsOverlay`, `MissingDeductionItemOverlay`, navigation keys |
| User entry to overlay | **None** while hidden (today only the widget opens it) |
| Toggle mechanism | Module constant `SHOW_MISSING_DEDUCTIONS_WIDGET = false` in `lib/home/buildWidgetPages.ts` |
| Re-enable | Set constant to `true` and ship |
| Vercel Flag | **Not in scope** |

---

## Behavior

### When hidden (`SHOW_MISSING_DEDUCTIONS_WIDGET = false`)

- `buildWidgetPageKeys` never pushes `"missing"`.
- Pager order treats the user as having **no missing widget**, including Need Action / Deadline / Progress ordering branches that previously keyed off `hasMissing`.
- Example with Founder enabled: **Founder · Deadline · Progress** (3 equal cards, no swipe).
- `computeHomeWidgets` still computes `data.missing` (no perf change worth optimizing away).

### When re-enabled (`SHOW_MISSING_DEDUCTIONS_WIDGET = true`)

- Restores prior behavior documented in `2026-06-18-home-widget-pager-design.md` and `2026-06-18-need-action-widget-slot-design.md`.

---

## Implementation

| File | Change |
|------|--------|
| `lib/home/buildWidgetPages.ts` | Add `SHOW_MISSING_DEDUCTIONS_WIDGET`; derive `effectiveHasMissing = SHOW_MISSING_DEDUCTIONS_WIDGET && data.missing.missing.length > 0`; use `effectiveHasMissing` everywhere `hasMissing` was used for pager assembly |
| `lib/home/buildWidgetPages.test.ts` | Update tests: missing data present but `"missing"` key absent when constant is `false`; add comment or test documenting re-enable |
| `docs/product/PRODUCT-SPEC.md` §12 | Note Missing Deductions Widget hidden (code retained) |

### Unchanged

- `components/home/widgets/MissingDeductionsWidget.tsx`
- `lib/home/computeMissingDeductions.ts`
- `components/home/overlays/MissingDeductionsOverlay.tsx`
- `components/home/overlays/MissingDeductionItemOverlay.tsx`
- `components/home/HomeScreen.tsx` (`onMissingReview` wiring stays)

---

## Testing

- Unit: `npm run test:unit -- lib/home/buildWidgetPages.test.ts`
- Manual: home with industry + receipts that would trigger missing hints → **no** green Find More Savings card; Founder / Deadline / Progress still render; swipe/dots unchanged when ≤3 widgets.

---

## Out of scope

- Removing overlay components or i18n keys
- Feature flag / remote toggle
- Changing missing-deduction computation rules
