# Home Widget Pager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pin dashboard widgets below Snap in a 3-across pager with swipe when >3 widgets; receipt list scrolls alone.

**Architecture:** Pure `buildWidgetPages()` chunks visible widget keys into pages; `WidgetPager` renders fixed full-width pages with flex column widths (50/33/100%); `HomeScreen` moves widget slot out of `HomeScrollRegion`.

**Tech Stack:** Next.js 16 · React 19 · Tailwind 4 · node:test

**Spec:** `docs/superpowers/specs/2026-06-18-home-widget-pager-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/home/buildWidgetPages.ts` | Chunk widget ids into pages; width tier per page |
| `lib/home/buildWidgetPages.test.ts` | Pagination unit tests |
| `components/home/widgets/WidgetPager.tsx` | Page viewport, dots, renders widget cards |
| `components/home/widgets/WidgetStack.tsx` | Thin wrapper: maps `HomeWidgetsData` → pager slots |
| `components/home/HomeScreen.tsx` | Fixed chrome composition |
| `components/home/HomeScrollRegion.tsx` | Scroll children only |
| `lib/ui/homeVisual.ts` | Pager tokens (replace carousel slide widths) |
| `docs/product/PRODUCT-SPEC.md` | Fixed zone includes WidgetPager |

---

### Task 1: Pagination pure function

**Files:**
- Create: `lib/home/buildWidgetPages.ts`
- Create: `lib/home/buildWidgetPages.test.ts`

- [ ] **Step 1:** Define `WidgetPageKey = 'deadline' | 'missing' | 'progress' | 'cpa'` and `buildWidgetPageKeys(data: HomeWidgetsData): WidgetPageKey[]` using existing visibility rules.
- [ ] **Step 2:** Implement `chunkPages(keys, maxPerPage = 3): WidgetPageKey[][]`.
- [ ] **Step 3:** Implement `pageColumnClass(count: 1 | 2 | 3): string` returning flex basis classes (`100%` / `50%` / `33.333%`).
- [ ] **Step 4:** Write tests for 4-widget, 3-widget, 2-widget (no missing), order preservation.
- [ ] **Step 5:** Run `npm run test:unit -- lib/home/buildWidgetPages.test.ts`.

---

### Task 2: Visual tokens

**Files:**
- Modify: `lib/ui/homeVisual.ts`

- [ ] **Step 1:** Add `widgetPager` tokens (`container`, `viewport`, `viewportPaginated`, `page`, `cardBase`, `dots`, `dot`, `dotActive`).
- [ ] **Step 2:** Mark `widgetCarousel` as deprecated in comment; remove `38vw` slide width from active widget usage path.

---

### Task 3: WidgetPager component

**Files:**
- Create: `components/home/widgets/WidgetPager.tsx`
- Modify: `components/home/widgets/WidgetStack.tsx`
- Modify: `components/home/widgets/TaxDeadlineWidget.tsx`
- Modify: `components/home/widgets/MissingDeductionsWidget.tsx`
- Modify: `components/home/widgets/TaxYearProgressWidget.tsx`
- Modify: `components/home/widgets/CpaReadyWidget.tsx`

- [ ] **Step 1:** Create `WidgetPager` — accepts `pages`, render props / data + callbacks; maps keys to existing widget components.
- [ ] **Step 2:** Single page: static flex row, `overflow-x-hidden`, no dots.
- [ ] **Step 3:** Multi page: horizontal scroll viewport with `snap-x snap-mandatory`, each page `w-full shrink-0 flex gap-2`; **no** `scroll-smooth`.
- [ ] **Step 4:** Page dots when `pages.length > 1`; sync active index on scroll (resize-safe).
- [ ] **Step 5:** Update each widget to use `homeVisual.widgetPager.cardBase` + `flex-1 min-w-0` from parent wrapper instead of `widgetCarousel.slide`.
- [ ] **Step 6:** Refactor `WidgetStack` to call `buildWidgetPageKeys` + `WidgetPager`; remove `WidgetCarousel` export or make it private.

---

### Task 4: Home shell layout

**Files:**
- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/HomeScrollRegion.tsx`
- Modify: `docs/product/PRODUCT-SPEC.md`

- [ ] **Step 1:** Move `<WidgetStack … />` from `HomeScrollRegion` `header` to fixed block immediately below Snap (after receipt notice if present, before scroll region).
- [ ] **Step 2:** Simplify `HomeScrollRegion` — drop `header` prop; only wrap receipt list content.
- [ ] **Step 3:** Update PRODUCT-SPEC §2.1 fixed vs scroll description.
- [ ] **Step 4:** Manual smoke — scroll list, widgets stay fixed; onboarding Snap ring unaffected.

---

### Task 5: Verification

- [ ] **Step 1:** `npm run test:unit -- lib/home/buildWidgetPages.test.ts`
- [ ] **Step 2:** `npm run lint` (note pre-existing errors OK if unchanged)
- [ ] **Step 3:** Manual checklist from spec §Testing

---

## Manual test checklist

- [ ] Widgets pinned under Snap while scrolling receipts
- [ ] 4 widgets (with CPA): swipe to page 2, CPA Export works
- [ ] Missing hidden: Deadline + Progress at 50% each
- [ ] ≤3 widgets: no swipe, no dots
- [ ] No smooth-scroll animation on pager
