# Home v2 First Screen — Design

**Date:** 2026-06-17  
**Status:** Approved  
**Reference:** `docs/ui/snaptax-home-ui.v2.png`  
**Scope:** Home first-screen refactor — header, hero, snap, privacy, widgets, filters, receipt list/detail display. Fixed chrome + scrollable list only. No hamburger nav, no 2×2 widget grid, no PDF export.

---

## Summary

Align the Snap1099 home screen with the v2 dashboard mockup while preserving product iron rules: two logical pages, Snap always visible in fixed chrome, zero modals in capture flow. Replaces photo hero with black card + shield, simplifies header actions, inlines privacy under Snap, extends widget pager with cyclic swipe and dynamic 4th card, introduces five-bucket receipt filters with AI confidence tiers, and clarifies list/detail tax amount colors plus category vs IRS line separation.

---

## Locked decisions

| Topic | Choice |
|-------|--------|
| Scroll model | **Fixed chrome** + **receipt list scroll only** (unchanged) |
| Top bar | Hero TaxHeader — **Export + Settings only** (remove Sync, Filter) |
| Export label | **CPA/IRS Ready** (`aria-label` + optional short visible text) |
| Hero | Black card + shield icon + amount (no worker photo) |
| Snap | Unchanged |
| Privacy | Inline one-liner under Snap + Learn more → `privacy-trust` overlay; remove standalone `TrustBar` from fixed chrome |
| Widget layout | **WidgetPager** horizontal, max 3 per page, **cyclic swipe** when >3 widgets |
| 4th widget slot | **Mutually exclusive:** tax season → CPA Ready; off-season + blurry > 0 → Need Action; else hidden |
| Tax season | Reuse `shouldShowCpaReadyWidget` (Jan–Apr or ≤15 days before estimated deadline) |
| Filters | ALL / READY (green) / REVIEW (yellow) / ACTION (red) / PROCESSING |
| AI confidence | **Three tiers:** `<0.5 → ACTION (blurry)` · `0.5–0.69 → done + REVIEW` · `≥0.7 → READY`; persist `aiConfidence` on receipt |
| List title | **RECENT RECEIPTS**; Pull to refresh in title row (right) |
| Receipt amounts | Deductible → green `-$tax`; non-deductible → gray `$0.00` |
| Category vs Line | Friendly category label separate from IRS Line pill (Line 22, Line 24b, N/A) |

---

## Layout architecture

```
┌─ Fixed (no scroll) ─────────────────────────────────────┐
│ TaxHeader — black card hero, CPA/IRS Ready, Settings    │
│ SnapButton — full-width yellow SNAP RECEIPT             │
│ InlinePrivacyNote — one line + Learn more               │
│ WidgetPager — Missing · Deadline · Progress · (4th)     │
├─ Scroll region (flex-1 min-h-0 overflow-y-auto) ────────┤
│ ReceiptFilterBar — ALL · READY · REVIEW · ACTION · …    │
│ List header — RECENT RECEIPTS · Pull to refresh           │
│ ReceiptList — cards with green/gray tax + category/line │
└─────────────────────────────────────────────────────────┘
```

**PRODUCT-SPEC update:** Fixed chrome becomes `TaxHeader + Snap + InlinePrivacy + WidgetPager` (TrustBar component retired from home).

---

## §1 TaxHeader + Hero

- **Container:** `rounded-2xl border border-zinc-800 bg-zinc-900` on black page background; no `hero.png`, no `min-h-[132px]`.
- **Left column:** `ESTIMATED TAX SAVED` (10px uppercase) · `text-4xl font-black text-yellow-400` amount · `{n} receipts • ${total} tracked`.
- **Right column:** Decorative shield + `$` icon (v2 golden shield asset or inline SVG).
- **Actions (top-right of header row):**
  - **CPA/IRS Ready** — same export gate as today (`useTaxExportGate`); icon button with `aria-label="CPA/IRS Ready"`; optional 9px caption under icon.
  - **Settings** — unchanged.
- **Removed:** Sync, Filter buttons and all `HomeScreen` wiring (`onSyncClick`, `onFilterClick`, `listSyncing` on header only — sync moves to list pull-to-refresh).

---

## §2 Snap

No structural changes to `SnapButton`, camera overlay, batch/postReview, or onboarding focus ring.

---

## §3 Inline privacy

Replace `TrustBar` fixed block with `InlinePrivacyNote` directly under Snap padding block:

- Copy: `IRS never sees your receipts. Your data is private and secure.`
- **Learn more >** → `setHomeOverlay("privacy-trust")`.
- Style: `text-[10px] text-zinc-400`, green link `text-green-400/90`.
- Camera compliance footnote remains **only** on `CameraOverlay` (no Terms repeat here).

`OfflineHomeShell`: same inline note; Learn more optional/disabled offline.

---

## §4 WidgetPager

### Visible widgets (order)

1. **Missing deductions** — if `missing.missing.length > 0`
2. **Tax deadline** — always
3. **Tax year progress** — always
4. **Fourth slot (one of):**

| Condition | Widget |
|-----------|--------|
| `shouldShowCpaReadyWidget(now)` | **CPA Ready** → export gate |
| Else `blurryCount > 0` | **Need Action** — show count, **RESNAP NOW** CTA |
| Else | Omit 4th widget |

Tax season **wins** over Need Action even when blurry receipts exist.

### Cyclic swipe

When total widgets > 3 (multiple pages): on swipe past last page → wrap to page 0; before first → wrap to last. Keep pagination dots. Implementation: modulo page index on `scrollend` / snap, or duplicate sentinel slides — prefer scroll-snap + index wrap without extra DOM.

### New component

`NeedActionWidget.tsx` — red theme (`homeVisual.widgets.needAction` token), copy e.g. `{n} receipt(s) blurry`, tap RESNAP → filter ACTION or trigger resnap on first blurry id.

---

## §5 Receipt filter buckets

### Tabs

| Tab | Active color | Rule |
|-----|--------------|------|
| ALL | Yellow | All receipts |
| READY | Green ring/text | `done` && !`needsUserReview` |
| REVIEW | Yellow | `done` && `needsUserReview` |
| ACTION | Red | `blurry` \|\| `photoMissing` |
| PROCESSING | Zinc/blue | `processing`; **sync stuck** included (card ⚠️ retained) |

Remove legacy tabs: `done`, `blurry`, `stuck` as separate filter ids.

### `needsUserReview(receipt)` — Phase 1 + 2

**Phase 1 (immediate heuristics on existing data):**

- Category missing or `OTHER`
- `done` with `amount` missing or ≤ 0
- Reuse `receiptNeedsExportReview`

**Phase 2 (with persisted `aiConfidence`):**

- `0.5 ≤ aiConfidence < 0.7` on `done` receipts
- Amount anomaly flags (future: threshold rules in `receiptBucket.ts`)

**Not REVIEW (explicit):**

- Blurry / unreadable → **ACTION** only
- Personal / `deductible === false` with valid category → **READY** with gray `$0.00` (no user action)

**Not in scope for REVIEW MVP:** personal/business mix, IRS high-risk flags, missing-deduction widget items as per-receipt filter.

### Module

`lib/receipts/receiptBucket.ts`:

```ts
export type ReceiptBucket = "ready" | "review" | "action" | "processing";
export function classifyReceiptBucket(receipt, opts?): ReceiptBucket;
export function countReceiptBuckets(receipts, syncStuckIds): BucketCounts;
export function filterReceiptsByBucket(receipts, filter, syncStuckIds): Receipt[];
```

---

## §6 AI confidence pipeline

**Change** `lib/openai/receiptVision.ts` behavior:

| Confidence | Status | Bucket |
|------------|--------|--------|
| `< 0.5` or parse fail | `blurry` | ACTION |
| `0.5 – 0.69` | `done` | REVIEW |
| `≥ 0.7` | `done` | READY (if other review rules pass) |

- Persist `aiConfidence` on server (`snaptax_receipts` JSON field or new column) and client `Receipt` + IndexedDB.
- Expose in `ApiReceipt` / `apiReceiptToLocal`.
- Threshold env: keep `RECEIPT_CONFIDENCE_THRESHOLD=0.7` as READY floor; add `RECEIPT_ACTION_THRESHOLD=0.5` (default).

Existing blurry receipts remain ACTION until resnapped.

---

## §7 Receipt list header

- Title i18n key: `recentReceipts` → **RECENT RECEIPTS**
- **Pull to refresh** moved to same row, right-aligned (v2); calls existing manual list sync.
- Disabled when offline; spinning state during sync.

Remove duplicate refresh control from filter area if present.

---

## §8 Receipt list card display (§10 approved)

### Tax amount (right column)

| Condition | Display | Class |
|-----------|---------|-------|
| Deductible && `taxAmount > 0` | `-{formatCurrency(taxAmount)}` | `text-green-400 font-extrabold` |
| Otherwise (done) | `$0.00` | `text-zinc-500 font-extrabold` |

Extend `StatusPill` with `doneMuted` variant for gray.

### Subtitle row (two columns)

```
{time} · {categoryDisplay}          [Line 22]
```

- **Category:** `receiptCategoryDisplayLabel(category)` — Tools, Fuel, Meals, Personal, Other…
- **Line pill:** `irsScheduleLineBadge(category)` — Line 22, Line 24b, N/A; `bg-zinc-700/80 text-[10px]`

Do not concatenate category and line in one string.

### Category display map (US)

| Category | Label | Line |
|----------|-------|------|
| TRUCK GAS | Fuel | Line 9 |
| TOOLS / SUPPLIES / MATERIALS | Tools / Supplies | Line 22 |
| MEALS | Meals | Line 24b |
| EQUIPMENT | Equipment | Line 13 |
| PERSONAL | Personal | N/A |
| OTHER | Other | Line 27a |

New file: `lib/receipts/receiptCategoryDisplay.ts` + unit tests.

---

## §9 Receipt detail sheet

Align with list rules:

- Hero saved amount: green `-tax` or muted gray `$0.00` (existing `buildReceiptDetailHero` + token cleanup).
- Detail section: **Category** row = friendly name; **IRS Line** row = Line badge only.
- `CategoryBadge` shows category name only.

---

## §10 Out of scope

- Hamburger menu, DASHBOARD title, notification bell
- 2×2 widget grid (stay horizontal pager)
- Merchant logo images (keep emoji icons)
- PDF export / Flow D from mockup
- Referral, EN/ES toggle on home
- Web push notifications
- Referral backend

---

## Files (implementation map)

| File | Action |
|------|--------|
| `components/home/TaxHeader.tsx` | Black card hero, shield, trim actions |
| `components/home/InlinePrivacyNote.tsx` | **New** |
| `components/home/TrustBar.tsx` | Remove from Home / Offline |
| `components/home/HomeScreen.tsx` | Wire inline privacy, header props |
| `components/home/OfflineHomeShell.tsx` | Same |
| `components/home/widgets/NeedActionWidget.tsx` | **New** |
| `components/home/widgets/WidgetPager.tsx` | Cyclic swipe |
| `lib/home/buildWidgetPages.ts` | 4th slot mutual exclusion |
| `lib/ui/homeVisual.ts` | Hero tokens, needAction widget colors |
| `components/home/ReceiptFilterBar.tsx` | 5 tabs + semantic colors |
| `components/home/ReceiptList.tsx` | Header refresh, bucket filter |
| `components/home/ReceiptListCard.tsx` | Green/gray tax, category/line |
| `components/home/StatusPill.tsx` | `doneMuted` |
| `lib/receipts/receiptBucket.ts` | **New** |
| `lib/receipts/receiptCategoryDisplay.ts` | **New** |
| `lib/openai/receiptVision.ts` | Three-tier confidence |
| `lib/types.ts` | `aiConfidence?: number` |
| `prisma/schema.prisma` + migration | `ai_confidence` optional |
| `lib/client/receiptApi.ts` | Map confidence from API |
| `components/receipts/ReceiptDetailSheet.tsx` | Category/line + colors |
| `lib/i18n/*` | Filter labels, list title, widget copy |
| `docs/product/PRODUCT-SPEC.md` | IA + filter + list rules |

---

## Acceptance criteria

1. Fixed chrome: TaxHeader (black card) → Snap → inline privacy → WidgetPager; list scrolls independently.
2. Header shows only CPA/IRS Ready + Settings; export gate unchanged.
3. Widget pager cycles when >3 widgets; 4th slot follows tax season / blurry rules.
4. Filters: five tabs with correct counts and semantic active colors.
5. REVIEW populated for low-confidence done receipts after pipeline change.
6. List: RECENT RECEIPTS + pull to refresh in header row.
7. Done cards: green deductible tax vs gray `$0.00`; category and Line 22/24b visually separated.
8. Detail sheet matches list tax/color and category/line split.
9. `npm run test:unit` passes including new bucket/category tests.

---

## Implementation phases

| Phase | Deliverable |
|-------|-------------|
| **P1** | Hero + header + inline privacy + PRODUCT-SPEC |
| **P2** | Widget 4th slot + NeedAction + cyclic pager |
| **P3** | receiptBucket + filter bar + list header refresh |
| **P4** | AI confidence tiers + persistence + receipt card/detail display |

Phases may ship in one PR on branch `0.3.2.home.ui` or `feat/home-v2-first-screen`.

---

**Approved:** 2026-06-17 — user confirmed §1–§10 with no modifications.
