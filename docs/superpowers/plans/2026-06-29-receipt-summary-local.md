# Receipt Summary (snaptax_receipts_summary) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add IndexedDB store `snaptax_receipts_summary` with incremental updates for the **current tax season**, so Home tax header and Settings Tax Overview read O(1) aggregates instead of scanning `snaptax_receipts`.

**Architecture:** New pure modules `receiptSummaryDelta.ts` (per-receipt contributions) and `receiptSummary.ts` (IDB CRUD + apply delta + rebuild + watermark). Hook `receiptDb.saveReceipt` / `deleteReceipt` after every write. Idle job verifies watermark vs current-season receipts and rebuilds on drift. UI switches from `sumUnfiledLocalTaxSavedIndexed` / visible-list `useMemo` to `readCurrentSeasonSummary()`.

**Tech Stack:** IndexedDB v7 bump, Node test runner (`npm run test:unit`), existing `lib/tax/taxYearStats.ts` formulas, `lib/receipts/filedStatus.ts`.

**Spec:** [`docs/superpowers/specs/2026-06-29-receipt-summary-local-design.md`](../specs/2026-06-29-receipt-summary-local-design.md)

**Out of scope:** Phase B sync/recovery · byCategory/byQuarter UI · server PG summary · OCR pipeline changes

---

## File map

| File | Action |
|------|--------|
| `lib/storage/idbStores.ts` | **Modify** — `IDB_DB_VERSION = 7`, `IDB_STORE_RECEIPT_SUMMARY` |
| `lib/storage/receiptSummaryTypes.ts` | **Create** — `ReceiptSeasonSummary`, watermark types |
| `lib/tax/taxYearStats.ts` | **Modify** — export `effectiveReceiptTaxYear`, add `countReceiptsInTaxYearAllStatuses` |
| `lib/tax/taxYearStats.test.ts` | **Create** |
| `lib/storage/receiptSummaryDelta.ts` | **Create** — contribution + delta math |
| `lib/storage/receiptSummaryDelta.test.ts` | **Create** |
| `lib/storage/receiptSummary.ts` | **Create** — read / apply / rebuild / watermark |
| `lib/storage/receiptSummary.test.ts` | **Create** — rebuild parity vs scan |
| `lib/client/receiptSummaryVerify.ts` | **Create** — idle schedule + verify |
| `lib/client/receiptSummaryVerify.test.ts` | **Create** |
| `lib/storage/receiptDb.ts` | **Modify** — v7 store, hooks on save/delete, bootstrap flag |
| `lib/client/receiptSync.ts` | **Modify** — no change if saveReceipt hooks; verify persistMerged uses saveReceipt |
| `components/home/HomeScreen.tsx` | **Modify** — read summary for tax + settings stats |
| `components/home/OfflineHomeShell.tsx` | **Modify** — same as HomeScreen for tax header |
| `lib/storage/idbStores.test.ts` | **Modify** — assert version 7 + store constant |

---

## Task 1: Types and tax-year helpers

**Files:**
- Create: `lib/storage/receiptSummaryTypes.ts`
- Modify: `lib/tax/taxYearStats.ts`
- Create: `lib/tax/taxYearStats.test.ts`

- [ ] **Step 1: Write failing test for all-status count**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countReceiptsInTaxYearAllStatuses,
  effectiveReceiptTaxYear,
} from "@/lib/tax/taxYearStats";
import type { Receipt } from "@/lib/types";

function r(partial: Partial<Receipt> & Pick<Receipt, "id" | "timestamp">): Receipt {
  return { status: "processing", ...partial };
}

describe("taxYearStats extensions", () => {
  it("effectiveReceiptTaxYear uses incomeTaxYear for 1099 forms", () => {
    const year = effectiveReceiptTaxYear(
      r({
        id: "1",
        timestamp: new Date("2026-06-01T12:00:00.000Z"),
        category: "1099-NEC",
        incomeTaxYear: 2025,
      }),
      "America/New_York",
    );
    assert.equal(year, 2025);
  });

  it("countReceiptsInTaxYearAllStatuses includes processing", () => {
    const tz = "UTC";
    const receipts = [
      r({ id: "a", timestamp: new Date("2026-01-01T00:00:00.000Z"), status: "processing" }),
      r({ id: "b", timestamp: new Date("2026-01-02T00:00:00.000Z"), status: "done" }),
      r({ id: "c", timestamp: new Date("2025-01-01T00:00:00.000Z"), status: "done" }),
    ];
    assert.equal(countReceiptsInTaxYearAllStatuses(receipts, 2026, tz), 2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- lib/tax/taxYearStats.test.ts`  
Expected: FAIL — exports not found

- [ ] **Step 3: Implement helpers**

In `lib/tax/taxYearStats.ts`:

```typescript
export function effectiveReceiptTaxYear(
  receipt: Pick<Receipt, "timestamp" | "category" | "incomeTaxYear">,
  timeZone: string = clientTimeZone(),
): number {
  if (isIncomeFormType(receipt.category) && receipt.incomeTaxYear != null) {
    return receipt.incomeTaxYear;
  }
  return receiptTaxYear(receipt.timestamp, timeZone);
}

export function countReceiptsInTaxYearAllStatuses(
  receipts: Receipt[],
  year: number,
  timeZone: string = clientTimeZone(),
): number {
  return receipts.filter(
    (r) => effectiveReceiptTaxYear(r, timeZone) === year,
  ).length;
}

export function currentTaxYear(timeZone: string = clientTimeZone()): number {
  return receiptTaxYear(new Date(), timeZone);
}
```

Remove the private duplicate `effectiveReceiptTaxYear` — use the exported one inside `receiptsInTaxYear`.

Add `lib/storage/receiptSummaryTypes.ts`:

```typescript
export const RECEIPT_SUMMARY_SCHEMA_VERSION = 1 as const;
export const RECEIPT_SUMMARY_WATERMARK_KEY = "receipt_summary_watermark" as const;
export const RECEIPT_SUMMARY_BOOTSTRAP_KEY = "receipt_summary_bootstrap" as const;

export type ReceiptSeasonSummary = {
  scopeKey: string;
  taxYear: number;
  unfiledTaxSaved: number;
  totalReceiptCount: number;
  totalDeductions: number;
  incomeFormCount: number;
  totalIncomeGross: number;
  byCategory?: Record<string, { deductions: number; count: number }>;
  byQuarter?: Record<1 | 2 | 3 | 4, { unfiledTaxSaved: number; totalReceiptCount: number }>;
  lastUpdatedMs: number;
};

export type ReceiptSummaryWatermark = {
  maxUpdatedAtMs: number;
  receiptCountInCurrentSeason: number;
  schemaVersion: typeof RECEIPT_SUMMARY_SCHEMA_VERSION;
};
```

- [ ] **Step 4: Run tests**

Run: `npm run test:unit -- lib/tax/taxYearStats.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/tax/taxYearStats.ts lib/tax/taxYearStats.test.ts lib/storage/receiptSummaryTypes.ts
git commit -m "feat: add tax year helpers for receipt summary"
```

---

## Task 2: Delta math (TDD)

**Files:**
- Create: `lib/storage/receiptSummaryDelta.ts`
- Create: `lib/storage/receiptSummaryDelta.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeSummaryDelta } from "@/lib/storage/receiptSummaryDelta";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

const TZ = "UTC";
const YEAR = 2026;

function receipt(partial: Partial<StoredReceipt> & Pick<StoredReceipt, "id">): StoredReceipt {
  return {
    status: "processing",
    timestamp: new Date("2026-03-01T12:00:00.000Z"),
    ...partial,
  };
}

describe("computeSummaryDelta", () => {
  it("insert processing receipt increments totalReceiptCount only", () => {
    const d = computeSummaryDelta(null, receipt({ id: "1" }), YEAR, TZ);
    assert.equal(d.totalReceiptCount, 1);
    assert.equal(d.unfiledTaxSaved, 0);
  });

  it("done unfiled receipt adds taxAmount to unfiledTaxSaved", () => {
    const next = receipt({ id: "1", status: "done", taxAmount: 12.5 });
    const d = computeSummaryDelta(null, next, YEAR, TZ);
    assert.equal(d.unfiledTaxSaved, 12.5);
  });

  it("filed receipt does not add to unfiledTaxSaved", () => {
    const next = receipt({
      id: "1",
      status: "done",
      taxAmount: 12.5,
      taxSeason: "2026",
      taxSeasonDate: new Date("2026-04-01T00:00:00.000Z"),
    });
    const d = computeSummaryDelta(null, next, YEAR, TZ);
    assert.equal(d.unfiledTaxSaved, 0);
    assert.equal(d.totalReceiptCount, 1);
  });

  it("export filed transition subtracts prior unfiled tax", () => {
    const prev = receipt({ id: "1", status: "done", taxAmount: 10 });
    const next = receipt({
      id: "1",
      status: "done",
      taxAmount: 10,
      taxSeason: "2026",
      taxSeasonDate: new Date("2026-04-15T00:00:00.000Z"),
    });
    const d = computeSummaryDelta(prev, next, YEAR, TZ);
    assert.equal(d.unfiledTaxSaved, -10);
    assert.equal(d.totalReceiptCount, 0);
  });

  it("delete removes contributions", () => {
    const prev = receipt({ id: "1", status: "done", taxAmount: 5 });
    const d = computeSummaryDelta(prev, null, YEAR, TZ);
    assert.equal(d.unfiledTaxSaved, -5);
    assert.equal(d.totalReceiptCount, -1);
  });

  it("ignores receipts outside current tax year", () => {
    const next = receipt({
      id: "1",
      timestamp: new Date("2025-01-01T00:00:00.000Z"),
    });
    const d = computeSummaryDelta(null, next, YEAR, TZ);
    assert.equal(d.totalReceiptCount, 0);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm run test:unit -- lib/storage/receiptSummaryDelta.test.ts`

- [ ] **Step 3: Implement `receiptSummaryDelta.ts`**

```typescript
import { isReceiptFiled } from "@/lib/receipts/filedStatus";
import type { StoredReceipt } from "@/lib/storage/receiptDb";
import { effectiveReceiptTaxYear } from "@/lib/tax/taxYearStats";
import { isIncomeFormType } from "@/lib/export/incomeDocuments";
import { resolveDeductionRatio } from "@/lib/tax/usCategories";

export type SummaryDelta = {
  unfiledTaxSaved: number;
  totalReceiptCount: number;
  totalDeductions: number;
  incomeFormCount: number;
  totalIncomeGross: number;
};

function inSeason(
  row: StoredReceipt | null,
  taxYear: number,
  timeZone: string,
): boolean {
  if (!row) return false;
  return effectiveReceiptTaxYear(row, timeZone) === taxYear;
}

function unfiledTaxContribution(row: StoredReceipt): number {
  if (row.status !== "done" || isReceiptFiled(row)) return 0;
  return row.taxAmount ?? 0;
}

function deductionContribution(row: StoredReceipt): number {
  if (row.status !== "done") return 0;
  if (isIncomeFormType(row.category)) return 0;
  if (!row.deductible || row.amount == null) return 0;
  const ratio = resolveDeductionRatio(row.category ?? "OTHER", 1);
  return Math.round(row.amount * ratio * 100) / 100;
}

function incomeFormContribution(row: StoredReceipt): { count: number; gross: number } {
  if (row.status !== "done" || !isIncomeFormType(row.category)) {
    return { count: 0, gross: 0 };
  }
  return { count: 1, gross: row.amount ?? 0 };
}

function contributions(row: StoredReceipt): SummaryDelta {
  const income = incomeFormContribution(row);
  return {
    unfiledTaxSaved: unfiledTaxContribution(row),
    totalReceiptCount: 1,
    totalDeductions: deductionContribution(row),
    incomeFormCount: income.count,
    totalIncomeGross: income.gross,
  };
}

const ZERO: SummaryDelta = {
  unfiledTaxSaved: 0,
  totalReceiptCount: 0,
  totalDeductions: 0,
  incomeFormCount: 0,
  totalIncomeGross: 0,
};

export function computeSummaryDelta(
  prev: StoredReceipt | null,
  next: StoredReceipt | null,
  taxYear: number,
  timeZone: string,
): SummaryDelta {
  const prevIn = inSeason(prev, taxYear, timeZone);
  const nextIn = inSeason(next, taxYear, timeZone);
  const prevC = prevIn && prev ? contributions(prev) : ZERO;
  const nextC = nextIn && next ? contributions(next) : ZERO;
  return {
    unfiledTaxSaved: nextC.unfiledTaxSaved - prevC.unfiledTaxSaved,
    totalReceiptCount: nextC.totalReceiptCount - prevC.totalReceiptCount,
    totalDeductions: nextC.totalDeductions - prevC.totalDeductions,
    incomeFormCount: nextC.incomeFormCount - prevC.incomeFormCount,
    totalIncomeGross: nextC.totalIncomeGross - prevC.totalIncomeGross,
  };
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm run test:unit -- lib/storage/receiptSummaryDelta.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/storage/receiptSummaryDelta.ts lib/storage/receiptSummaryDelta.test.ts
git commit -m "feat: add incremental receipt summary delta math"
```

---

## Task 3: Summary store CRUD + rebuild

**Files:**
- Modify: `lib/storage/idbStores.ts`
- Create: `lib/storage/receiptSummary.ts`
- Create: `lib/storage/receiptSummary.test.ts`

- [ ] **Step 1: Bump IDB version**

In `lib/storage/idbStores.ts`:

```typescript
export const IDB_DB_VERSION = 7 as const;
export const IDB_STORE_RECEIPT_SUMMARY = "snaptax_receipts_summary" as const;
```

- [ ] **Step 2: Write rebuild parity test (uses in-memory mock or documents manual IDB test)**

For node, test pure rebuild function with injected receipt list:

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSeasonSummaryFromReceipts } from "@/lib/storage/receiptSummary";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

describe("buildSeasonSummaryFromReceipts", () => {
  it("matches scan logic for mixed statuses", () => {
    const receipts: StoredReceipt[] = [
      { id: "1", status: "processing", timestamp: new Date("2026-02-01T00:00:00.000Z") },
      { id: "2", status: "done", taxAmount: 4, timestamp: new Date("2026-02-02T00:00:00.000Z") },
      { id: "3", status: "done", taxAmount: 6, taxSeason: "2026", taxSeasonDate: new Date("2026-04-01T00:00:00.000Z"), timestamp: new Date("2026-02-03T00:00:00.000Z") },
    ];
    const summary = buildSeasonSummaryFromReceipts(receipts, 2026, "UTC");
    assert.equal(summary.totalReceiptCount, 3);
    assert.equal(summary.unfiledTaxSaved, 4);
  });
});
```

- [ ] **Step 3: Implement `buildSeasonSummaryFromReceipts` + IDB helpers**

Key exports in `receiptSummary.ts`:

```typescript
export function buildSeasonSummaryFromReceipts(
  receipts: StoredReceipt[],
  taxYear: number,
  timeZone: string,
): ReceiptSeasonSummary;

export async function readCurrentSeasonSummary(): Promise<ReceiptSeasonSummary>;
export async function readCurrentSeasonUnfiledTaxSaved(): Promise<number>;
export async function applyReceiptSummaryDelta(
  db: IDBDatabase,
  prev: StoredReceipt | null,
  next: StoredReceipt | null,
): Promise<void>;
export async function rebuildCurrentSeasonSummary(db: IDBDatabase): Promise<ReceiptSeasonSummary>;
export async function readSummaryWatermark(db: IDBDatabase): Promise<ReceiptSummaryWatermark | null>;
export async function writeSummaryWatermark(db: IDBDatabase): Promise<void>;
export function computeWatermarkFromReceipts(
  receipts: StoredReceipt[],
  taxYear: number,
  timeZone: string,
): ReceiptSummaryWatermark;
```

`applyReceiptSummaryDelta` loads current summary row (or zeros), applies `computeSummaryDelta`, clamps negatives to 0 where appropriate, `put` summary row, updates watermark via `writeSummaryWatermark`.

`rebuildCurrentSeasonSummary`: `loadAllReceipts()` → filter by year → `buildSeasonSummaryFromReceipts` → put → watermark.

- [ ] **Step 4: Run tests**

Run: `npm run test:unit -- lib/storage/receiptSummary.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/storage/idbStores.ts lib/storage/receiptSummary.ts lib/storage/receiptSummary.test.ts
git commit -m "feat: add receipt season summary store module"
```

---

## Task 4: IDB v7 migration + write hooks

**Files:**
- Modify: `lib/storage/receiptDb.ts`

- [ ] **Step 1: Create summary store in `onupgradeneeded`**

When `oldVersion < 7`:

```typescript
if (!db.objectStoreNames.contains(IDB_STORE_RECEIPT_SUMMARY)) {
  db.createObjectStore(IDB_STORE_RECEIPT_SUMMARY, { keyPath: "scopeKey" });
}
// after snaptax store migration block:
if (oldVersion < 7 && db.objectStoreNames.contains(IDB_STORE_SYSTEM_META)) {
  tx.objectStore(systemMetaStoreName(db)).put({
    key: RECEIPT_SUMMARY_BOOTSTRAP_KEY,
    value: "pending",
  });
}
```

- [ ] **Step 2: Hook `saveReceipt`**

Before `put`, read existing row by id (readonly tx). After successful put, call `applyReceiptSummaryDelta(db, oldRow, newRow)`.

Pattern:

```typescript
export async function saveReceipt(receipt: StoredReceipt): Promise<void> {
  const db = await openDb();
  const old = await getReceiptById(db, receipt.id);
  // ... existing put logic ...
  await applyReceiptSummaryDelta(db, old, receipt);
}
```

Extract internal `getReceiptById` if not present (readonly get + deserialize).

- [ ] **Step 3: Hook `deleteReceipt`**

```typescript
const old = await getReceiptById(db, id);
// ... delete photo + receipt row ...
await applyReceiptSummaryDelta(db, old, null);
```

- [ ] **Step 4: Bootstrap on first open after upgrade**

After `openDb` resolves, if `system_meta.receipt_summary_bootstrap === "pending"`:

```typescript
await rebuildCurrentSeasonSummary(db);
await writeSystemMeta(RECEIPT_SUMMARY_BOOTSTRAP_KEY, "done");
```

Call from `warmReceiptDb()` once (same pattern as photo OPFS migration).

- [ ] **Step 5: Run full unit suite**

Run: `npm run test:unit`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/storage/receiptDb.ts
git commit -m "feat: wire receipt summary hooks and IDB v7 migration"
```

---

## Task 5: Idle watermark verify

**Files:**
- Create: `lib/client/receiptSummaryVerify.ts`
- Create: `lib/client/receiptSummaryVerify.test.ts`

- [ ] **Step 1: Write failing test for drift detection**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summaryWatermarkDrifted } from "@/lib/client/receiptSummaryVerify";
import type { ReceiptSummaryWatermark } from "@/lib/storage/receiptSummaryTypes";

describe("summaryWatermarkDrifted", () => {
  it("returns true when counts differ", () => {
    const wm: ReceiptSummaryWatermark = {
      maxUpdatedAtMs: 100,
      receiptCountInCurrentSeason: 2,
      schemaVersion: 1,
    };
    const computed = { maxUpdatedAtMs: 100, receiptCountInCurrentSeason: 3, schemaVersion: 1 };
    assert.equal(summaryWatermarkDrifted(wm, computed), true);
  });
});
```

- [ ] **Step 2: Implement verify + schedule**

```typescript
export function summaryWatermarkDrifted(
  stored: ReceiptSummaryWatermark | null,
  computed: ReceiptSummaryWatermark,
): boolean {
  if (!stored) return true;
  if (stored.schemaVersion !== computed.schemaVersion) return true;
  return (
    stored.maxUpdatedAtMs !== computed.maxUpdatedAtMs ||
    stored.receiptCountInCurrentSeason !== computed.receiptCountInCurrentSeason
  );
}

export async function verifyReceiptSummaryWatermark(): Promise<"ok" | "rebuilt"> {
  const db = await warmReceiptDb();
  const receipts = await loadAllReceipts();
  const year = currentTaxYear();
  const computed = computeWatermarkFromReceipts(receipts, year, clientTimeZone());
  const stored = await readSummaryWatermark(db);
  if (!summaryWatermarkDrifted(stored, computed)) return "ok";
  await rebuildCurrentSeasonSummary(db);
  return "rebuilt";
}

export function scheduleReceiptSummaryVerify(delayMs = 30_000): void {
  if (typeof window === "undefined") return;
  const run = () => void verifyReceiptSummaryWatermark().catch(() => {});
  if ("requestIdleCallback" in window) {
    window.setTimeout(() => {
      window.requestIdleCallback(() => run(), { timeout: 60_000 });
    }, delayMs);
    return;
  }
  globalThis.setTimeout(run, delayMs);
}
```

- [ ] **Step 3: Run tests + commit**

Run: `npm run test:unit -- lib/client/receiptSummaryVerify.test.ts`

```bash
git add lib/client/receiptSummaryVerify.ts lib/client/receiptSummaryVerify.test.ts
git commit -m "feat: add idle receipt summary watermark verification"
```

---

## Task 6: UI — read summary instead of scan

**Files:**
- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/OfflineHomeShell.tsx`

- [ ] **Step 1: Replace tax saved reads**

Replace:

```typescript
import { sumUnfiledLocalTaxSavedIndexed } from "@/lib/storage/receiptDb";
```

With:

```typescript
import {
  readCurrentSeasonSummary,
  readCurrentSeasonUnfiledTaxSaved,
} from "@/lib/storage/receiptSummary";
```

Replace all production calls to `sumUnfiledLocalTaxSavedIndexed()` with `readCurrentSeasonUnfiledTaxSaved()`.

Add state for settings summary or load in `refreshTaxSaved`:

```typescript
const refreshTaxAndSummary = useCallback(async () => {
  const summary = await readCurrentSeasonSummary();
  setTaxSaved(summary.unfiledTaxSaved);
  setSeasonSummary(summary);
}, []);
```

- [ ] **Step 2: Replace `settingsTaxStats` useMemo**

```typescript
const settingsTaxStats = useMemo((): SettingsTaxStats => {
  if (!seasonSummary) {
    return {
      taxSaved: displayTaxSaved ?? taxSaved,
      receiptCount: displayReceipts.length,
      totalDeductions: taxYearDeductions(displayReceipts, currentTaxYear(), clientTimeZone()),
      incomeFormCount: incomeFormsInTaxYear(displayReceipts, currentTaxYear(), clientTimeZone()),
      totalIncomeGross: totalIncomeGrossInTaxYear(displayReceipts, currentTaxYear(), clientTimeZone()),
    };
  }
  return {
    taxSaved: seasonSummary.unfiledTaxSaved,
    receiptCount: seasonSummary.totalReceiptCount,
    totalDeductions: seasonSummary.totalDeductions,
    incomeFormCount: seasonSummary.incomeFormCount,
    totalIncomeGross: seasonSummary.totalIncomeGross,
  };
}, [seasonSummary, displayTaxSaved, taxSaved, displayReceipts]);
```

Prefer summary when loaded; fallback keeps offline-first paint until bootstrap completes.

- [ ] **Step 3: Schedule verify on startup**

Alongside `schedulePhotoRetentionPurge()` in deferred startup:

```typescript
scheduleReceiptSummaryVerify();
```

- [ ] **Step 4: Mirror changes in `OfflineHomeShell.tsx`**

Same tax header read path.

- [ ] **Step 5: Manual smoke**

Run: `npm run dev`  
1. Open app → DevTools → IDB `snaptax_receipts_summary` has one row for current year  
2. Snap receipt → `totalReceiptCount` increments  
3. Settings Receipts matches full local season count (not capped at 100)

- [ ] **Step 6: Commit**

```bash
git add components/home/HomeScreen.tsx components/home/OfflineHomeShell.tsx
git commit -m "feat: read tax stats from local receipt summary store"
```

---

## Task 7: Export filed + merge path verification

**Files:**
- Modify: `lib/storage/receiptSummary.test.ts` (add merge/filed case)

- [ ] **Step 1: Add test simulating filed transition via delta chain**

Extend `receiptSummaryDelta.test.ts` or integration test: prev done unfiled → next done filed → unfiledTaxSaved net zero for season.

- [ ] **Step 2: Confirm `handlePostExportSync` path**

After export, server sets `taxSeason` / `taxSeasonDate` → `syncFromServer` → `persistMergedReceipts` → `saveReceipt` → summary hook fires. No extra code if hooks work; if sync does not pull filed fields, add explicit local patch in `handlePostExportSync` after merge.

Verify in dev: export →顶栏 Est. Tax Saved drops.

- [ ] **Step 3: Commit (if fix needed)**

```bash
git commit -m "fix: ensure export filed state updates receipt summary"
```

---

## Task 8: idbStores test + docs

**Files:**
- Modify: `lib/storage/idbStores.test.ts`

- [ ] **Step 1: Assert v7 and store name**

```typescript
import { IDB_DB_VERSION, IDB_STORE_RECEIPT_SUMMARY } from "@/lib/storage/idbStores";

assert.equal(IDB_DB_VERSION, 7);
assert.equal(IDB_STORE_RECEIPT_SUMMARY, "snaptax_receipts_summary");
```

- [ ] **Step 2: Final test run**

Run: `npm run test:unit`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add lib/storage/idbStores.test.ts
git commit -m "test: assert IDB v7 receipt summary store constants"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| G1 summary store current season | Task 3–4 |
| G2 UI no full scan | Task 6 |
| G3 write + idle verify | Task 4–5 |
| G4 byCategory/byQuarter reserved | Task 1 types |
| G5 totalReceiptCount all statuses | Task 1–2 |
| G6 merge triggers delta | Task 4, 7 |
| v7 migration | Task 4 |
| Export filed unfiled drop | Task 2, 7 |
| OCR no change | — |

---

## Acceptance (from spec §11)

1. IDB row exists; production UI does not call `sumUnfiledLocalTaxSavedIndexed`
2. Settings Receipts = season `totalReceiptCount`
3. Export后顶栏 unfiledTaxSaved 下降
4. `npm run test:unit` green
