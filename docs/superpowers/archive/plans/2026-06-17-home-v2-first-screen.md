# Home v2 First Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the home first screen to match `docs/ui/snaptax-home-ui.v2.png` — black-card hero, trimmed header, inline privacy, cyclic widget pager with dynamic 4th card, five-bucket filters, AI confidence tiers, and receipt list/detail tax + category/line display — while keeping fixed chrome + scrollable list only.

**Architecture:** Four incremental phases on branch `0.3.2.home.ui`. Pure functions (`receiptBucket`, `receiptCategoryDisplay`, `buildWidgetPageKeys`) drive UI; TaxHeader/InlinePrivacy/WidgetPager compose fixed chrome; ReceiptList consumes bucket filters. AI pipeline writes `aiConfidence` to DB + local Receipt for REVIEW bucket. No new routes; overlays unchanged.

**Tech Stack:** Next.js 16 · React 19 · Tailwind 4 · Prisma · node:test · IndexedDB (`receiptDb`)

**Spec:** `docs/superpowers/specs/2026-06-17-home-v2-first-screen-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `components/home/TaxHeader.tsx` | Black-card hero, shield, Export + Settings only |
| `components/home/InlinePrivacyNote.tsx` | Snap-below privacy one-liner |
| `components/home/HomeScreen.tsx` | Fixed chrome wiring, remove header sync/filter |
| `components/home/OfflineHomeShell.tsx` | Same chrome as online |
| `components/home/widgets/NeedActionWidget.tsx` | Red blurry-count widget |
| `components/home/widgets/WidgetPager.tsx` | Cyclic horizontal pager |
| `lib/home/buildWidgetPages.ts` | Widget keys + 4th-slot mutual exclusion |
| `lib/receipts/receiptBucket.ts` | READY/REVIEW/ACTION/PROCESSING classification |
| `lib/receipts/receiptCategoryDisplay.ts` | Friendly category labels |
| `lib/openai/receiptVision.ts` | Three-tier confidence → status |
| `components/home/ReceiptFilterBar.tsx` | Five semantic filter tabs |
| `components/home/ReceiptList.tsx` | Bucket filter + RECENT RECEIPTS header |
| `components/home/ReceiptListCard.tsx` | Green/gray tax, category vs Line pill |
| `components/home/StatusPill.tsx` | `doneMuted` gray variant |
| `components/receipts/ReceiptDetailSheet.tsx` | Align hero + detail rows |
| `lib/ui/homeVisual.ts` | Hero card + needAction widget tokens |
| `lib/types.ts` | `aiConfidence?: number` on Receipt |
| `prisma/schema.prisma` + migration | `ai_confidence` column |
| `lib/i18n/types.ts` + locales | Filter labels, export aria, needAction copy |
| `docs/product/PRODUCT-SPEC.md` | Updated home IA |

---

## Phase P1 — Hero, header, inline privacy

### Task 1: Visual tokens + shield icon

**Files:**
- Modify: `lib/ui/homeVisual.ts`
- Create: `components/icons/TaxShieldIcon.tsx` (optional inline SVG in TaxHeader if preferred)

- [ ] **Step 1:** Add `heroCard` tokens to `homeVisual.ts`:

```ts
heroCard: {
  shell: "mx-4 mt-2 rounded-2xl border border-zinc-800 bg-zinc-900",
  shield: "text-yellow-400",
},
```

- [ ] **Step 2:** Remove unused `heroImage`, `heroOverlay`, `heroTint` from active TaxHeader path (keep keys deprecated or delete if nothing else imports).

- [ ] **Step 3:** Add `widgets.needAction` color trio matching v2 red card (`bg-red-950/80`, `border-red-700/60`, `accent text-red-300`).

---

### Task 2: TaxHeader black card

**Files:**
- Modify: `components/home/TaxHeader.tsx`
- Modify: `lib/i18n/types.ts`, `lib/i18n/locales/en-US.ts`, `fr-FR.ts`, `de-DE.ts`

- [ ] **Step 1:** Remove props and UI for `onSyncClick`, `onFilterClick`, `syncing`, `syncDisabled`, and related icon imports.

- [ ] **Step 2:** Replace photo hero layers with `homeVisual.heroCard.shell` wrapper; layout = flex row: left text column + right shield SVG (golden shield + `$`, ~48px).

- [ ] **Step 3:** Export button — keep `DownloadIcon`; set `aria-label` from new i18n key `home.taxHeader.cpaIrsReady: "CPA/IRS Ready"`. Optional 9px caption under icon: `CPA/IRS`.

- [ ] **Step 4:** Settings + Install + Export coach pulse unchanged.

- [ ] **Step 5:** Run `npm run lint -- --max-warnings=0 components/home/TaxHeader.tsx` (fix new issues only).

---

### Task 3: InlinePrivacyNote

**Files:**
- Create: `components/home/InlinePrivacyNote.tsx`
- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/OfflineHomeShell.tsx`

- [ ] **Step 1:** Create component reusing `home.trustBar.message` + `learnMore` copy:

```tsx
export function InlinePrivacyNote({ onLearnMore }: { onLearnMore?: () => void }) {
  const copy = useUserCopy().home.trustBar;
  return (
    <p className="mx-4 mb-2 px-0 text-[10px] font-medium leading-snug text-zinc-400">
      <span className="text-green-400/90" aria-hidden>🛡 </span>
      {copy.message}{" "}
      {onLearnMore ? (
        <button type="button" onClick={onLearnMore} className="font-bold text-green-400/90 active:scale-95">
          {copy.learnMore} &gt;
        </button>
      ) : null}
    </p>
  );
}
```

- [ ] **Step 2:** In `HomeScreen`, remove `<TrustBar />`; after Snap block insert `<InlinePrivacyNote onLearnMore={() => setHomeOverlay("privacy-trust")} />`.

- [ ] **Step 3:** Same in `OfflineHomeShell` without `onLearnMore`.

- [ ] **Step 4:** Remove header sync/filter props from `<TaxHeader />` in both shells.

---

### Task 4: PRODUCT-SPEC P1

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md`

- [ ] **Step 1:** Update §2.1 layout row: `TaxHeader + Snap + InlinePrivacy + WidgetPager`.

- [ ] **Step 2:** Update §3 tree: remove TrustBar node; document Export label CPA/IRS Ready; header actions Export + Settings only.

- [ ] **Step 3:** Commit P1:

```bash
git add lib/ui/homeVisual.ts components/home/TaxHeader.tsx components/home/InlinePrivacyNote.tsx \
  components/home/HomeScreen.tsx components/home/OfflineHomeShell.tsx lib/i18n docs/product/PRODUCT-SPEC.md
git commit -m "feat(home): v2 black-card hero, CPA/IRS Ready header, inline privacy"
```

---

## Phase P2 — Widget 4th slot + Need Action + cyclic pager

### Task 5: buildWidgetPages mutual exclusion

**Files:**
- Modify: `lib/home/buildWidgetPages.ts`
- Modify: `lib/home/buildWidgetPages.test.ts`

- [ ] **Step 1:** Extend `WidgetPageKey` with `"needAction"`.

- [ ] **Step 2:** Add helper `resolveFourthWidgetKey(data: HomeWidgetsData, blurryCount: number): WidgetPageKey | null`:

```ts
if (data.showCpaReady) return "cpa";
if (blurryCount > 0) return "needAction";
return null;
```

- [ ] **Step 3:** Update `buildWidgetPageKeys` to append fourth key from helper; pass `blurryCount` as param.

- [ ] **Step 4:** Tests:

```ts
it("tax season prefers cpa over needAction even with blurry", () => {
  const data = baseWidgets({ showCpaReady: true });
  assert.deepEqual(buildWidgetPageKeys(data, 2), ["deadline", "progress", "cpa"]);
});
it("off season with blurry shows needAction", () => {
  const data = baseWidgets({ showCpaReady: false, missing: empty });
  assert.deepEqual(buildWidgetPageKeys(data, 1), ["deadline", "progress", "needAction"]);
});
```

- [ ] **Step 5:** Run `npm run test:unit -- lib/home/buildWidgetPages.test.ts`.

---

### Task 6: NeedActionWidget

**Files:**
- Create: `components/home/widgets/NeedActionWidget.tsx`
- Modify: `lib/i18n/types.ts` + locales (`home.widgets.needAction`)

- [ ] **Step 1:** i18n keys:

```ts
needAction: {
  label: "NEED ACTION",
  blurryCount: "{count} receipt(s) blurry",
  resnap: "RESNAP NOW",
},
```

- [ ] **Step 2:** Widget component — red card, count line, CTA text (button inside card); `onResnap` callback.

- [ ] **Step 3:** Wire in `WidgetPager.renderWidget` case `"needAction"`.

---

### Task 7: Cyclic WidgetPager

**Files:**
- Modify: `components/home/widgets/WidgetPager.tsx`
- Modify: `components/home/widgets/WidgetStack.tsx`
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1:** Pass `blurryCount` from `countByStatus(receipts).blurry` into `WidgetStack` → `buildWidgetPageKeys`.

- [ ] **Step 2:** On `scrollend` (or scroll listener with debounce), when `paginated`:
  - If `scrollLeft >= maxScroll - 2` and user swiped forward → `scrollTo({ left: 0, behavior: 'auto' })`
  - If `scrollLeft <= 2` and user swiped backward from page 0 → scroll to last page
  - Track `lastScrollLeft` to detect direction; ignore programmatic scrolls with ref flag.

- [ ] **Step 3:** `NeedActionWidget` `onResnap`: set list filter to ACTION (lift filter state to HomeScreen later in P3 — for P2 call `onResnap(firstBlurryId)` prop from HomeScreen).

- [ ] **Step 4:** Manual smoke: 4 widgets → swipe page 2 → swipe again wraps to page 1.

- [ ] **Step 5:** Commit P2:

```bash
git commit -m "feat(home): need-action widget, 4th-slot rules, cyclic widget pager"
```

---

## Phase P3 — Receipt buckets + filter bar + list header

### Task 8: receiptBucket module

**Files:**
- Create: `lib/receipts/receiptBucket.ts`
- Create: `lib/receipts/receiptBucket.test.ts`

- [ ] **Step 1:** Define types:

```ts
export type ReceiptBucket = "ready" | "review" | "action" | "processing";
export type ReceiptListFilter = "all" | ReceiptBucket;

export function classifyReceiptBucket(
  receipt: Receipt,
  opts?: { syncStuck?: boolean },
): ReceiptBucket {
  if (receipt.status === "processing") return "processing";
  if (receipt.status === "blurry" || receipt.photoMissing) return "action";
  if (receipt.status === "done" && needsUserReview(receipt)) return "review";
  return "ready";
}

export function needsUserReview(receipt: Receipt): boolean {
  if (receipt.status !== "done") return false;
  if (receiptNeedsExportReview(receipt)) return true;
  if (receipt.amount == null || receipt.amount <= 0) return true;
  const c = receipt.aiConfidence;
  if (c != null && c >= 0.5 && c < 0.7) return true;
  return false;
}
```

- [ ] **Step 2:** `countReceiptBuckets(receipts, syncStuckIds)` — map each receipt; processing count includes stuck ids.

- [ ] **Step 3:** `filterReceiptsByBucket(receipts, filter, syncStuckIds)`.

- [ ] **Step 4:** Tests for each bucket + edge cases (PERSONAL done → ready, OTHER → review, blurry → action).

- [ ] **Step 5:** Run `npm run test:unit -- lib/receipts/receiptBucket.test.ts`.

---

### Task 9: ReceiptFilterBar v2

**Files:**
- Modify: `components/home/ReceiptFilterBar.tsx`
- Modify: `lib/i18n/types.ts` + locales

- [ ] **Step 1:** Replace `ReceiptFilter` type with `ReceiptListFilter` from `receiptBucket.ts`.

- [ ] **Step 2:** Tabs: ALL, READY, REVIEW, ACTION, PROCESSING — remove stuck pill (stuck counted in PROCESSING).

- [ ] **Step 3:** Active styles:

```ts
const ACTIVE: Record<ReceiptListFilter, string> = {
  all: "bg-yellow-500 text-black",
  ready: "bg-green-600 text-white ring-2 ring-green-500/50",
  review: "bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500",
  action: "bg-red-600/90 text-white ring-2 ring-red-500/50",
  processing: "bg-zinc-700 text-zinc-200 ring-2 ring-blue-500/40",
};
```

- [ ] **Step 4:** i18n `home.receiptList.filters`: `ready`, `review`, `action`, `processing` (keep `all`).

---

### Task 10: ReceiptList header + bucket wiring

**Files:**
- Modify: `components/home/ReceiptList.tsx`
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1:** Replace `countByStatus` + local filter with `countReceiptBuckets` + `filterReceiptsByBucket`.

- [ ] **Step 2:** Title key → `recentReceipts: "Recent Receipts"` (display uppercase via CSS).

- [ ] **Step 3:** Header row:

```tsx
<div className="mb-2 flex items-center justify-between gap-2">
  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">{copy.recentReceipts}</h2>
  {onSyncClick && (
    <button ... aria-label={copy.pullToRefresh}>
      <RefreshIcon className={syncing ? "animate-spin" : ""} />
      {copy.pullToRefresh}
    </button>
  )}
</div>
```

- [ ] **Step 4:** Remove old refresh button duplicate if any; pass `onSyncClick` / `syncing` from HomeScreen only (not header).

- [ ] **Step 5:** Optional: lift `filter` state to HomeScreen so NeedAction widget can `setFilter("action")`.

- [ ] **Step 6:** Commit P3:

```bash
git commit -m "feat(home): v2 receipt buckets, filter tabs, recent receipts header"
```

---

## Phase P4 — AI confidence + receipt display

### Task 11: DB + types + API for aiConfidence

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `db/init-table.sql`
- Modify: `docs/tech/04-data-model.md`
- Modify: `lib/types.ts`
- Modify: `lib/client/receiptApi.ts`
- Modify: `lib/receipts/processReceiptTax.ts` (or receipt process write path)
- Create: `prisma/migrations/YYYYMMDD_ai_confidence/migration.sql`

- [ ] **Step 1:** Add column `aiConfidence Float? @map("ai_confidence")` to `SnaptaxReceipt`.

- [ ] **Step 2:** Sync `db/init-table.sql`: `ai_confidence DOUBLE PRECISION NULL` + COMMENT.

- [ ] **Step 3:** Run `npm run db:migrate:dev -- --name add_ai_confidence`.

- [ ] **Step 4:** Extend `Receipt` + `ApiReceipt` + `apiReceiptToLocal` with `aiConfidence?: number`.

- [ ] **Step 5:** On process completion, persist `fields.confidence` to `ai_confidence` and include in list API JSON.

- [ ] **Step 6:** IndexedDB `StoredReceipt` — field flows through existing serialize (no DB version bump if optional field on Receipt type).

---

### Task 12: Three-tier receiptVision

**Files:**
- Modify: `lib/openai/receiptVision.ts`
- Create: `lib/openai/receiptVision.test.ts` (or extend existing)

- [ ] **Step 1:** Add `actionThreshold()` default 0.5 from `RECEIPT_ACTION_THRESHOLD`.

- [ ] **Step 2:** Replace single threshold branch:

```ts
if (f.confidence < actionThreshold() || f.amount <= 0) {
  return blurryFallback(...);
}
if (f.confidence < confidenceThreshold()) {
  return { ...doneResult, status: "done", /* include confidence in fields */ };
}
return doneResult;
```

- [ ] **Step 3:** Tests: confidence 0.4 → blurry; 0.6 → done; 0.8 → done.

- [ ] **Step 4:** Run `npm run test:unit -- lib/openai/receiptVision.test.ts`.

---

### Task 13: receiptCategoryDisplay

**Files:**
- Create: `lib/receipts/receiptCategoryDisplay.ts`
- Create: `lib/receipts/receiptCategoryDisplay.test.ts`

- [ ] **Step 1:**

```ts
const LABELS: Record<string, string> = {
  "TRUCK GAS": "Fuel",
  TOOLS: "Tools",
  SUPPLIES: "Supplies",
  MATERIALS: "Supplies",
  MEALS: "Meals",
  EQUIPMENT: "Equipment",
  PERSONAL: "Personal",
  OTHER: "Other",
};

export function receiptCategoryDisplayLabel(category?: string): string {
  if (!category) return "Other";
  return LABELS[category.toUpperCase().trim()] ?? "Other";
}

export function receiptTaxDisplay(receipt: Receipt): {
  label: string;
  variant: "deductible" | "muted";
} {
  const region = receipt.dataRegion ?? "us";
  const currency = receipt.currency ?? (region === "eu" ? "EUR" : "USD");
  const tax = receipt.taxAmount ?? 0;
  const deductible = receipt.deductible !== false && tax > 0;
  if (deductible) {
    return {
      label: `-${formatCurrencyForRegion(tax, currency, region)}`,
      variant: "deductible",
    };
  }
  return {
    label: formatCurrencyForRegion(0, currency, region),
    variant: "muted",
  };
}
```

- [ ] **Step 2:** Unit tests for TOOLS→Tools, PERSONAL→Personal, tax display variants.

- [ ] **Step 3:** Run tests.

---

### Task 14: ReceiptListCard + StatusPill

**Files:**
- Modify: `components/home/StatusPill.tsx`
- Modify: `components/home/ReceiptListCard.tsx`

- [ ] **Step 1:** StatusPill — add variant `doneMuted` with `text-zinc-500`.

- [ ] **Step 2:** Done card — use `receiptTaxDisplay`; pass `variant === "deductible" ? "done" : "doneMuted"`.

- [ ] **Step 3:** Subtitle row:

```tsx
<div className="mt-0.5 flex items-center justify-between gap-2">
  <p className="truncate text-xs text-zinc-400">
    {listDate} · {receiptCategoryDisplayLabel(receipt.category)}
  </p>
  <span className="shrink-0 rounded bg-zinc-700/80 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
    {irsScheduleLineBadge(receipt.category)}
  </span>
</div>
```

- [ ] **Step 4:** Remove raw `categoryLabel` uppercase enum from subtitle.

---

### Task 15: ReceiptDetailSheet alignment

**Files:**
- Modify: `components/receipts/ReceiptDetailSheet.tsx`
- Modify: `components/receipts/ReceiptDetailSheet` CategoryBadge usage

- [ ] **Step 1:** Hero green/gray — ensure `buildReceiptDetailHero` muted uses `text-zinc-500` consistently.

- [ ] **Step 2:** Category row shows `receiptCategoryDisplayLabel`; IRS Line row unchanged (`irsScheduleLineBadge`).

- [ ] **Step 3:** `CategoryBadge` text = display label not raw enum.

---

### Task 16: Final verification + PRODUCT-SPEC

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md`

- [ ] **Step 1:** Document filter buckets §3 + receipt list display rules.

- [ ] **Step 2:** `npm run test:unit` — all pass.

- [ ] **Step 3:** Manual checklist (below).

- [ ] **Step 4:** Commit P4:

```bash
git commit -m "feat(home): v2 filters, AI confidence tiers, receipt tax/category display"
```

---

## Manual test checklist

- [ ] Black-card hero with shield; no worker photo
- [ ] Header: CPA/IRS Ready export + Settings only; no sync/filter
- [ ] Inline privacy under Snap opens privacy-trust overlay
- [ ] Widget pager: 4 widgets swipe; cyclic wrap works
- [ ] Tax season: 4th card = CPA Ready even with blurry receipts
- [ ] Off-season + blurry: Need Action shows count; RESNAP works
- [ ] Filters: ALL/READY/REVIEW/ACTION/PROCESSING counts correct
- [ ] RECENT RECEIPTS + pull to refresh syncs list
- [ ] Deductible receipt: green -$tax; personal: gray $0.00
- [ ] Subtitle: friendly category left, Line 22/24b pill right
- [ ] Detail sheet matches list colors and labels
- [ ] Fixed chrome stays pinned; list scrolls
- [ ] Offline shell: inline privacy, no learn more

---

## Spec coverage self-review

| Spec section | Task |
|--------------|------|
| §1 TaxHeader + Hero | Task 1–2 |
| §2 Snap unchanged | — |
| §3 Inline privacy | Task 3 |
| §4 WidgetPager + 4th slot | Task 5–7 |
| §5 Filters | Task 8–10 |
| §6 AI confidence | Task 11–12 |
| §7 List header | Task 10 |
| §8 List card display | Task 13–14 |
| §9 Detail sheet | Task 15 |
| §10 Out of scope | Not planned |
| Acceptance 1–9 | Task 16 checklist |

---

**Plan complete.** Branch: `0.3.2.home.ui`.
