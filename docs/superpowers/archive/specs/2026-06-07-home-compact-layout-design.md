# Home Compact Layout — Design

**Date:** 2026-06-07  
**Status:** Approved (design)  
**Scope:** First-screen vertical space rebalance — compact header, rectangular snap shutter, dense receipt list with category icons.

## Problem

On mobile (see user screenshot), the home screen allocates too much height to the tax header (~25%) and circular snap button (~35%), leaving the receipt list with only ~1 visible card. Users cannot scan recent receipts without scrolling.

## Decisions

| Topic | Choice |
|-------|--------|
| Summary line | **B** — compact subtitle: `{n} receipts · ${total} tracked` |
| Snap aspect | **C** — fixed `h-[140px]` + full width; ratio follows viewport |
| Approach | **方案 1** — independent component slimming |
| Icons | Emoji per category/status (MVP); helper in `receiptListIcon.ts` |

## Layout Architecture

```
┌─────────────────────────────────────┐  ~10vh (max-h-[10vh] min-h-[72px])
│ ESTIMATED TAX SAVED        [⚙️]     │
│ $1,420.50                           │  text-3xl tracking-tight
│ 5 receipts · $4,120 tracked         │  text-[11px] single line truncate
├─────────────────────────────────────┤  shrink-0
│ ┌─────────────────────────────────┐ │
│ │ 📷  SNAP RECEIPT                │ │  h-[140px] w-full rounded-2xl
│ └─────────────────────────────────┘ │
│ Compliance footnote (compact)       │
├─────────────────────────────────────┤  flex-1 min-h-0 (~60vh+)
│ Filter pills + ALL LOCAL RECEIPTS   │
│ Compact receipt cards (scroll)      │
└─────────────────────────────────────┘
```

### HomeScreen flex

| Zone | Classes |
|------|---------|
| Root | `flex h-full flex-col overflow-hidden` |
| TaxHeader | `shrink-0 max-h-[10vh] min-h-[72px]` |
| Snap zone | `shrink-0 px-4 py-2` — **remove** `max-h-[42vh]` |
| ReceiptList | `flex-1 min-h-0` (unchanged) |

---

## §1 TaxHeader

**Layout:** horizontal flex row — left text block + right settings button, vertically centered.

| Element | Tailwind / copy |
|---------|-----------------|
| Container | `flex items-center justify-between px-4 py-2 border-b-2 border-yellow-500 bg-zinc-900` |
| Left block | flex-col, left-aligned |
| Title | `ESTIMATED TAX SAVED` · `text-[10px] font-bold uppercase tracking-wider text-zinc-400` |
| Amount | `text-3xl font-extrabold tracking-tight text-yellow-400` (+ bounce anim) |
| Subtitle | `{receiptCount} receipt(s) · {formatCurrency(totalExpenses)} tracked` · `text-[11px] font-bold text-zinc-500 truncate max-w-[70vw]` |
| Settings | top-right `h-11 w-11` rounded button (was top-left block) |

Remove centered column layout and extra `mb-4` settings row.

---

## §2 SnapButton (viewfinder shutter)

Replace circular `h-56 w-56` with full-width rectangle.

| Property | Value |
|----------|-------|
| Button | `w-full h-[140px] max-h-[18vh] rounded-2xl border-4 border-white bg-yellow-500` |
| Layout | `flex flex-row items-center justify-center gap-3` |
| Icon | `CameraIcon` `h-10 w-10` |
| Label | `SNAP RECEIPT` · `text-lg font-black uppercase` |
| Resnap hint | `text-xs font-bold opacity-80` when `resnapId` set |
| Wrapper | `w-full px-4` inside Snap zone |
| Footnote | `mt-1.5 text-[10px] leading-tight` — keep ComplianceFootnote |

Camera overlay / iOS getUserMedia behavior unchanged.

---

## §3 ReceiptList + ReceiptListCard (compact)

### List container (`ReceiptList.tsx`)

| Change | From → To |
|--------|-----------|
| Card gap | `space-y-3` → `space-y-1.5` |
| Filter margin | `mb-4` → `mb-2` |
| Section padding | `p-6` → `px-4 pt-3 pb-4` |
| Header | `mb-4` → `mb-2` |

### Card (`ReceiptListCard.tsx`)

| Change | From → To |
|--------|-----------|
| Padding | `p-4` → `p-2.5` |
| Title | `text-base` → `text-sm font-extrabold` |
| Subtitle | `text-xs` (unchanged) |
| Tax amount | `text-sm font-extrabold` |
| Layout | Add left icon column `w-8 shrink-0 text-lg` + `flex gap-2.5` |

### Icon helper (`lib/receipts/receiptListIcon.ts`)

```typescript
getReceiptListIcon(receipt: Receipt, opts?: { analysisStuck?: boolean }): {
  emoji: string;
  ariaLabel: string;
  spin?: boolean; // processing analyzing
}
```

| Condition | Emoji | Notes |
|-----------|-------|-------|
| processing + pendingUpload | ☁️ | Uploading |
| processing + analysisStuck | ⚠️ | Paused |
| processing | ⚙️ | `spin: true` |
| blurry | ❌ | |
| category TRUCK GAS | ⛽ | |
| SUPPLIES / TOOLS / MATERIALS | 🛠️ | |
| MEALS | 🍔 | |
| EQUIPMENT | 🔧 | |
| default / OTHER | 🧾 | |

Done card example:
```
[⛽] Shell Oil                 -$20.00
     06/07/2026 · TRUCK GAS     Line 9
```

Processing / blurry cards use same icon column pattern.

---

## Files

| File | Action |
|------|--------|
| `components/home/TaxHeader.tsx` | Compact horizontal layout |
| `components/home/SnapButton.tsx` | Rectangular shutter |
| `components/home/HomeScreen.tsx` | Remove snap max-h cap |
| `components/home/ReceiptList.tsx` | Tighter spacing/padding |
| `components/home/ReceiptListCard.tsx` | Compact + icon column |
| `lib/receipts/receiptListIcon.ts` | **New** |
| `docs/product/PRODUCT-SPEC.md` §3 | Update layout description |

## Out of Scope

- ReceiptDetailSheet changes
- Filter bar logic changes
- SVG icon library
- Landscape-specific layout (use existing min breakpoints only if needed)

## Acceptance Criteria

1. iPhone-class viewport (~844px height): ≥ **3 full receipt cards** visible without scroll (including filter bar).
2. Header + snap + footnote combined ≤ **~25vh**.
3. List area consumes remaining **~55vh+**.
4. Settings gear on **top-right**; amount **text-3xl**.
5. Snap button full-width **~140px** tall with `SNAP RECEIPT` label.
6. Cards show category/status emoji on the left.
7. `npm run build` passes.

## Testing

- Visual check against provided screenshot baseline (more list visible).
- Verify snap still opens camera on iOS (user gesture chain).
- Done / processing / blurry cards render icons correctly.
- Long merchant names truncate without breaking layout.
