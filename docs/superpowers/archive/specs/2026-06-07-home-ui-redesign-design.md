# Home UI Redesign — Design

**Date:** 2026-06-07  
**Status:** Approved (design)  
**Scope:** Main screen layout, receipt list cards, status filter bar, Done/Blurry detail sheets.

## Summary

Redesign the Snap1099 home screen to emphasize tax savings, add status filtering, and unify list/detail UX around merchant-first dual-row cards. Processing cards remain clickable (detail sheet with spinner).

## Decisions

| Topic | Choice |
|-------|--------|
| Done list card right column | **Tax saved** (`-$taxAmount`), IRS Line badge bottom-right |
| Status filter bar | **All · Ready · Processing · Blurry** with live counts; default All |
| Processing list card | **Clickable** → detail sheet with spinner |
| Blurry list card | Card opens sheet; inline **RESNAP** button with `stopPropagation` |
| Snap button | Circular `w-56 h-56` yellow shutter |
| Online badge | **Removed** from list header |
| Implementation approach | **方案 1** — new list components + extend existing detail sheet |

## Layout

```
┌─────────────────────────────────┐
│ [⚙️ Settings]  (top-left)       │
│     ESTIMATED TAX SAVED         │
│        $1,420.50                │
│  Tracking $4,120.30 across      │
│  42 expense receipts            │
├─────────────────────────────────┤
│         ( ⭕ SNAP )             │  w-56 h-56 circle
│      ComplianceFootnote         │
├─────────────────────────────────┤
│ [All(42)][✓Ready(32)][⚙️6][⚠️4]│  horizontal scroll if needed
│ ALL LOCAL RECEIPTS              │
│  scrollable receipt list        │
└─────────────────────────────────┘
```

### Tax header

- **Title:** `ESTIMATED TAX SAVED` (uppercase, zinc-400)
- **Hero amount:** existing `taxSaved` + bounce animation; `text-5xl` yellow; EU uses `formatCurrencyForRegion`
- **Summary line:** `Tracking {totalExpenses} across {totalCount} expense receipts`
  - `totalExpenses` = `SUM(amount)` where `status === 'done'`
  - `totalCount` = all receipts (any status)
- **Settings:** gear button top-left (was top-right beside amount)

### Snap zone

- Replace rounded square with **circle** `h-56 w-56`, yellow fill, camera icon + `SNAP` label
- Keep `ComplianceFootnote`, camera overlay, iOS sync `getUserMedia` behavior unchanged

### Receipt list header

- Replace `Recent Receipts` + Online pill with **`ALL LOCAL RECEIPTS`**
- Filter bar above list (see below)

## Status filter bar

New component: `ReceiptFilterBar`

| Pill | Filter | Icon |
|------|--------|------|
| All (N) | no filter | — |
| Ready (N) | `status === 'done'` | ✓ |
| Processing (N) | `status === 'processing'` | ⚙️ |
| Blurry (N) | `status === 'blurry'` | ⚠️ |

- Counts computed client-side from merged receipt list
- Active pill: yellow background; inactive: zinc-800
- State: `useState<ReceiptFilter>('all')` in `ReceiptList` or `HomeScreen`
- Hide pills with `(0)` optional — show all four always with `(0)` when empty

## List cards

New component: `ReceiptListCard` replaces `ReceiptCard`.

Shared: dual-row layout, `rounded-xl border border-zinc-700 bg-zinc-800 p-4`, full-width tap target unless noted.

### Done

```
{merchant}                    -${taxAmount}
{date} · {category}           [Line N]
```

- **Left row 1:** merchant name (truncate)
- **Right row 1:** `-${formatCurrencyForRegion(taxAmount)}`; gray `$0.00` when non-deductible
- **Left row 2:** `formatLocalDate(timestamp, clientTz, region)` · category (human label)
- **Right row 2:** pill badge from `irsScheduleLineBadge(category)` e.g. `Line 9`, `Line 22`
- **Tap:** open `ReceiptDetailSheet`

### Processing

```
Uploading...                  Analyzing
{formatReceiptTime} · Processing   (animate-pulse yellow)
```

- **Tap:** open detail sheet (spinner + "Calculating your deductions...")
- No inline RESNAP

### Blurry

```
Receipt Blurry                [ RESNAP ]
{formatReceiptTime} · Need Action
```

- **Tap card body:** open Blurry detail sheet
- **RESNAP button:** `e.stopPropagation()` → `onResnap(id)` (same as sheet CTA)

## Done detail sheet

Extend `ReceiptDetailSheet` + `buildReceiptDetailHero`.

### Hero (deductible)

- Amount: `-$15.20` — **green** `text-green-400 text-4xl font-black` (not yellow)
- Subtitle: `✓ Added to Schedule C Deduction` (US)
- EU subtitle: `✓ Added to VAT recovery`

### Hero (non-deductible)

- `$0.00` muted gray
- Subtitle: `Personal (Non-Deductible)` / EU personal expense copy (existing)

### Detail rows

| Label | Value |
|-------|-------|
| Merchant | merchant |
| Total Amount | amount (was "Total (tax incl.)") |
| Category | `[SUPPLIES]` uppercase pill badge |
| IRS Line | `Line 22` short form |

Remove separate Date row from done sheet (date visible in list; blurry sheet keeps Date Captured).

### Photo section

- Heading: `Original Receipt Capture`
- Load order unchanged: IndexedDB blob → future `imageUrl`
- Tap → fullscreen (existing)

## Blurry detail sheet

### Hero

- Title: `⚠️ Tax AI Couldn't Read This`
- Subtitle: `The image is too blurry or shaky.`

### CTA

- Full-width yellow: `📸 RESNAP THIS RECEIPT` → `onResnap`

### Partial details

```
PARTIAL DETAILS
Possible Merchant: {merchant || "Unknown"} (Unclear)
Date Captured: {formatLocalDate(timestamp, tz, region)}
```

- Merchant from `receipt.merchant`; if empty show `Unknown (Unclear)`

### Blurry preview

- Same image source as done
- Wrapper with semi-transparent overlay: e.g. `relative` + `after:absolute after:inset-0 after:backdrop-blur-sm after:bg-black/30`
- Heading: `Blurry Preview`

## Processing detail sheet

No major redesign. Keep spinner + "Calculating your deductions...". Optionally show Date Captured row for consistency.

## Helpers

### `lib/receipts/receiptStats.ts` (new)

```typescript
countByStatus(receipts): { all, done, processing, blurry }
sumDoneExpenses(receipts): number
```

### `lib/tax/irsScheduleLabel.ts`

Add:

```typescript
irsScheduleLineBadge(category): string  // "Line 9", "Line 22", "N/A"
```

Parse from existing `IRS_LABELS` map via regex `Line (\d+[a-z]?)`.

### `lib/receipts/receiptDetail.ts`

Update `buildReceiptDetailHero` done branch:

- `savedLabel`: `-${amount}` without " Saved" suffix (sheet hero)
- `subtitle`: Schedule C / VAT recovery strings per region

## Files

| File | Action |
|------|--------|
| `components/home/TaxHeader.tsx` | Settings top-left, summary line, title copy |
| `components/home/SnapButton.tsx` | Circular button |
| `components/home/ReceiptFilterBar.tsx` | **New** |
| `components/home/ReceiptListCard.tsx` | **New** |
| `components/home/ReceiptList.tsx` | Filter state, new card, header copy |
| `components/home/ReceiptCard.tsx` | **Delete** after migration |
| `components/receipts/ReceiptDetailSheet.tsx` | Done/Blurry visual upgrade |
| `lib/receipts/receiptStats.ts` | **New** |
| `lib/tax/irsScheduleLabel.ts` | Add badge helper |
| `lib/receipts/receiptDetail.ts` | Hero copy/colors |
| `docs/product/PRODUCT-SPEC.md` §3 | Update IA |
| `docs/ui/ui.html` | Optional mock sync |

## Out of scope

- Fake iOS status bar (clock, battery)
- API / DB schema changes
- Separate sheet components per status
- `next-intl` / locale switching beyond existing `dataRegion` formatters

## Testing

1. Home: summary line totals match done receipts; filter counts correct
2. Filter each pill → list filters correctly
3. Done card shows tax saved + Line badge; tap opens green hero sheet
4. Processing card tap opens spinner sheet
5. Blurry RESNAP on list does not open sheet; card tap opens blurry sheet with overlay preview
6. Circular Snap still opens camera on iOS (user gesture chain)
7. EU region: DD/MM dates, 24h time, VAT copy
8. `npm run build` passes

## Success criteria

- Tax savings visually dominant on home header and done cards
- Users can filter by receipt status in one tap
- Done/Blurry detail sheets match approved wireframes
- No regression in snap, upload, or resnap flows
