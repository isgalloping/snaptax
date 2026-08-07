# Settings Tax Overview — Amount Overflow Fix — Design

**Date:** 2026-08-07  
**Status:** Approved (brainstorming + grilling)  
**Scope:** Prevent dollar amounts in `TaxOverviewPanel` from overflowing the card on narrow mobile viewports

---

## Problem

On ~390px viewports, the third column value (e.g. `$2,828.25`) overflows the card boundary. Root cause: equal `grid-cols-3` columns plus fixed large typography (`text-2xl sm:text-3xl font-black`) cannot fit 5+ digit currency strings in ~120px per column.

Screenshot reference: Settings → tax overview card, Deductions value clipped past right edge.

**Out of scope:** `TaxHeader` (home hero), Income sub-section, i18n copy changes.

---

## Goals

| Requirement | Detail |
|-------------|--------|
| No overflow | Amounts never clip or cause horizontal scroll |
| Full precision | Display up to `$99,999.99` without truncate or abbreviation |
| Layout | Keep one-row three-column layout (no 2+1 stack) |
| Receipts column | Keep fixed large size (`text-2xl sm:text-3xl`) |
| Money columns | Fluid typography via `clamp` + `tabular-nums` |
| Labels | May wrap up to 2 lines; values never wrap |

---

## Approach (selected)

**Unequal column widths + fluid money typography**

Rejected:

- **2+1 two-row layout** — safest overflow fix but changes card height and visual rhythm
- **Truncate / `$2.8K` abbrev** — breaks trust for tax amounts
- **Shrink all three columns uniformly** — Receipts would look de-emphasized without benefit

---

## Grilling decisions (locked)

1. Amount ceiling: `$99,999.99`
2. Layout: one row, three columns
3. Receipts: fixed `text-2xl sm:text-3xl`; Tax Saved + Deductions: shared money styles
4. Column ratio: `1.35fr · 0.55fr · 1.35fr`
5. Labels: `text-balance`, up to 2 lines; values: `whitespace-nowrap`

---

## Implementation

### Files

| File | Change |
|------|--------|
| `lib/ui/settingsVisual.ts` | Add `valueMoney`, `gridCols`; extend `label` |
| `components/settings/TaxOverviewPanel.tsx` | Apply new grid + class tokens |

### Layout

```
┌──────────────┬──────┬──────────────┐
│ EST. TAX     │ REC  │ DEDUCTIONS   │
│ SAVED        │ EIPTS│              │
│  $246.50     │  12  │  $2,828.25   │
│  (clamp)     │(fixed)│  (clamp)     │
└──────────────┴──────┴──────────────┘
     1.35fr      0.55fr    1.35fr
```

### `settingsVisual.taxOverview` tokens

```ts
gridCols: "grid grid-cols-[1.35fr_0.55fr_1.35fr] divide-x divide-zinc-700 py-4",
column: "flex min-w-0 flex-col items-center px-2 text-center",
label: "text-[10px] font-bold uppercase leading-tight text-balance text-zinc-400",
value: "mt-1 text-2xl font-black sm:text-3xl", // Receipts only
valueMoney:
  "mt-1 max-w-full text-[clamp(1.125rem,5.2vw,1.875rem)] font-black tabular-nums whitespace-nowrap",
```

### `TaxOverviewPanel.tsx`

- Replace outer grid class with `settingsVisual.taxOverview.gridCols`
- Each column wrapper: `settingsVisual.taxOverview.column`
- Tax Saved + Deductions values: `valueMoney` + existing color classes
- Receipts value: keep `value` + existing color classes
- Income / exported footer sections: unchanged

### Edge cases

| Scenario | Behavior |
|----------|----------|
| `$—` (Tax Saved null) | Uses `valueMoney`; fits easily |
| `$0.00` / `$99,999.99` | Clamp scales down within column |
| Receipts `999` | Fixed large type; fits in 0.55fr |
| Both money columns at max | Both shrink equally; still readable |

---

## Testing

| Type | Action |
|------|--------|
| Manual 390×844 | `$2,828.25` Deductions — no right-edge overflow |
| Manual 390×844 | Both money columns `$99,999.99` — full string visible |
| Manual 320px | No horizontal scroll; amounts intact |
| Manual | Receipts `12` remains visually large vs money columns |
| Unit | None (CSS-only layout) |

---

## Success criteria

- [ ] Deductions `$2,828.25` no longer overflows card on iPhone-width viewport
- [ ] `$99,999.99` displays fully in either money column at 390px
- [ ] Three-column single-row layout preserved
- [ ] No i18n or TaxHeader changes

---

## Risks

| Risk | Mitigation |
|------|------------|
| Dual `$99,999.99` at minimum clamp size | Accepted; still legible per product decision |
| Arbitrary Tailwind grid template | Document ratio in spec; centralize in `settingsVisual` |
