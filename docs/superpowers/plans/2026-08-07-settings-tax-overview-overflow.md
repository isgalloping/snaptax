# Settings Tax Overview Overflow Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `TaxOverviewPanel` dollar amount overflow on narrow mobile while displaying up to `$99,999.99` without truncation.

**Architecture:** Unequal CSS grid columns (`1.35fr · 0.55fr · 1.35fr`) with shared fluid typography for money values in `settingsVisual.ts`; Receipts keeps fixed large type.

**Tech Stack:** Next.js 16 · React 19 · Tailwind 4 · `components/settings/TaxOverviewPanel.tsx`

**Spec:** `docs/superpowers/specs/2026-08-07-settings-tax-overview-overflow-design.md`

## Global Constraints

- Black `#000000` / white `#FFFFFF` / yellow `#EAB308` palette unchanged
- No truncate or currency abbreviation for tax amounts
- Amount ceiling: `$99,999.99` full precision via existing `formatCurrency`
- Labels may wrap 2 lines; values `whitespace-nowrap`
- Out of scope: `TaxHeader`, i18n copy, Income footer block

---

### Task 1: Extend settings visual tokens

**Files:**
- Modify: `lib/ui/settingsVisual.ts`

**Interfaces:**
- Produces: `settingsVisual.taxOverview.gridCols`, `.column`, `.valueMoney`; updated `.label`

- [ ] **Step 1: Add tokens to `settingsVisual.taxOverview`**

```ts
taxOverview: {
  container: "...", // unchanged
  gridCols:
    "grid grid-cols-[1.35fr_0.55fr_1.35fr] divide-x divide-zinc-700 py-4",
  column: "flex min-w-0 flex-col items-center px-2 text-center",
  valuePositive: "text-green-500",
  valueNeutral: "text-zinc-200",
  label:
    "text-[10px] font-bold uppercase leading-tight text-balance text-zinc-400",
  value: "mt-1 text-2xl font-black sm:text-3xl",
  valueMoney:
    "mt-1 max-w-full text-[clamp(1.125rem,5.2vw,1.875rem)] font-black tabular-nums whitespace-nowrap",
  exportedStatus: "...", // unchanged
},
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run lint -- --max-warnings=0 lib/ui/settingsVisual.ts` (or `npx tsc --noEmit` if lint skips this file)

Expected: no errors

---

### Task 2: Apply tokens in TaxOverviewPanel

**Files:**
- Modify: `components/settings/TaxOverviewPanel.tsx`

**Interfaces:**
- Consumes: `settingsVisual.taxOverview.gridCols`, `.column`, `.valueMoney`, `.value`, `.label`

- [ ] **Step 1: Update grid and column wrappers**

Replace:

```tsx
<div className="grid grid-cols-3 divide-x divide-zinc-700 py-4">
  <div className="flex flex-col items-center px-2 text-center">
```

With:

```tsx
<div className={settingsVisual.taxOverview.gridCols}>
  <div className={settingsVisual.taxOverview.column}>
```

Apply `column` class to all three column divs.

- [ ] **Step 2: Split value classes — money vs receipts**

Tax Saved value:

```tsx
<p
  className={`${settingsVisual.taxOverview.valueMoney} ${valueColorClass(taxSaved !== null && taxSaved > 0)}`}
>
```

Receipts value — keep `settingsVisual.taxOverview.value`.

Deductions value:

```tsx
<p
  className={`${settingsVisual.taxOverview.valueMoney} ${valueColorClass(totalDeductions > 0)}`}
>
```

- [ ] **Step 3: Manual smoke at 390px width**

Run: `npm run dev` → `/app` → Settings

Verify with DevTools device mode (390×844):
- Deductions `$2,828.25` (or mock data) — no overflow past card border
- Temporarily test `$99,999.99` in both money columns if easy via devtools DOM edit

Expected: full amounts visible, no horizontal scroll

- [ ] **Step 4: Run unit tests (regression guard)**

Run: `npm run test:unit`

Expected: all pass (no new tests required)

- [ ] **Step 5: Commit**

```bash
git add lib/ui/settingsVisual.ts components/settings/TaxOverviewPanel.tsx \
  docs/superpowers/specs/2026-08-07-settings-tax-overview-overflow-design.md \
  docs/superpowers/plans/2026-08-07-settings-tax-overview-overflow.md
git commit -m "fix(settings): prevent tax overview amount overflow on narrow screens"
```

---

## Plan self-review

| Spec requirement | Task |
|------------------|------|
| Unequal column ratio | Task 1 `gridCols` |
| Money clamp + tabular-nums | Task 1 `valueMoney` |
| Receipts fixed size | Task 2 keeps `value` |
| Label wrap | Task 1 `label` leading-tight text-balance |
| min-w-0 columns | Task 1 `column` |
| Manual test matrix | Task 2 Step 3 |
| Out of scope honored | No other files in plan |

No placeholders remain.
