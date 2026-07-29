# IndexedDB Receipt Query + Tax-Season Filed Filter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** IDB v2 indexed queries (30 unfiled startup / 100 UI list / full corpus); unfiled-only Est. Tax Saved; server `tax_season` + `tax_season_date` columns and export marking.

**Architecture:** Add `filedStatus` helpers + PG migration + API aggregate filter; rebuild `receiptDb.ts` v2 with denormalized `isFiled` indexes; split HomeScreen Phase 0 into fast unfiled-30 + top-100 expand; mark receipts filed on tax-pack export.

**Tech Stack:** IndexedDB v2, Prisma/PostgreSQL partial indexes, Next.js API routes, existing LWW merge.

**Spec:** [`2026-06-10-indexeddb-receipt-query-design.md`](../specs/2026-06-10-indexeddb-receipt-query-design.md)

---

## File map

| File | Action |
|------|--------|
| `lib/receipts/filedStatus.ts` | Create |
| `lib/receipts/filedStatus.test.ts` | Create |
| `lib/types.ts` | Add `taxSeason`, `taxSeasonDate` |
| `prisma/schema.prisma` | Add columns |
| `db/init-table.sql` | Add columns + partial indexes |
| `prisma/migrations/YYYYMMDD_receipt_tax_season/` | Create migration |
| `lib/receipts/serialize.ts` | Serialize new fields |
| `lib/client/receiptApi.ts` | ApiReceipt types, `sumUnfiledLocalTaxSaved` |
| `app/api/receipts/route.ts` | Unfiled aggregate + list fields |
| `app/api/export/tax-pack/route.ts` | Mark exported receipts filed |
| `lib/storage/receiptDb.ts` | v2 schema, indexes, query API |
| `lib/client/receiptSync.ts` | Constants, merge filed fields |
| `lib/client/receiptSync.test.ts` | Update/add filed merge tests |
| `components/home/HomeScreen.tsx` | Phase 0-fast/full |
| `components/home/OfflineHomeShell.tsx` | Use new query API |
| `docs/tech/04-data-model.md` | Document columns (if exists) |

---

### Task 1: Filed status helpers

**Files:**
- Create: `lib/receipts/filedStatus.ts`
- Create: `lib/receipts/filedStatus.test.ts`

- [ ] **Step 1: `filedStatus.ts`**

```typescript
import type { Prisma } from "@prisma/client";

export function isReceiptFiled(row: {
  taxSeason?: string | null;
  taxSeasonDate?: Date | null;
}): boolean {
  const season = row.taxSeason?.trim();
  return Boolean(season && row.taxSeasonDate);
}

export function filedFlag(row: {
  taxSeason?: string | null;
  taxSeasonDate?: Date | null;
}): 0 | 1 {
  return isReceiptFiled(row) ? 1 : 0;
}

/** Prisma WHERE fragment: unfiled rows */
export function unfiledReceiptWhere(): Prisma.SnaptaxReceiptWhereInput {
  return {
    OR: [{ taxSeason: null }, { taxSeason: "" }, { taxSeasonDate: null }],
  };
}
```

- [ ] **Step 2: Tests**

```typescript
test("isReceiptFiled requires both season and date", () => {
  assert.equal(isReceiptFiled({ taxSeason: "2026", taxSeasonDate: new Date() }), true);
  assert.equal(isReceiptFiled({ taxSeason: "2026", taxSeasonDate: null }), false);
  assert.equal(isReceiptFiled({ taxSeason: null, taxSeasonDate: new Date() }), false);
});
```

- [ ] **Step 3: Run** `node --import tsx --test lib/receipts/filedStatus.test.ts`

---

### Task 2: PostgreSQL schema + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `db/init-table.sql`
- Create: `prisma/migrations/20260610120000_receipt_tax_season/migration.sql`

- [ ] **Step 1: Prisma fields on `SnaptaxReceipt`**

```prisma
taxSeason     String?   @map("tax_season") @db.VarChar(255)
taxSeasonDate DateTime? @map("tax_season_date") @db.Timestamptz(3)
```

Add partial indexes via raw SQL in migration (Prisma partial index support limited):

```sql
ALTER TABLE snaptax_receipts
  ADD COLUMN IF NOT EXISTS tax_season VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tax_season_date TIMESTAMPTZ(3);

CREATE INDEX IF NOT EXISTS snaptax_receipts_user_unfiled_updated_idx
  ON snaptax_receipts (user_id, updated_at DESC)
  WHERE (tax_season IS NULL OR tax_season = '' OR tax_season_date IS NULL);

CREATE INDEX IF NOT EXISTS snaptax_receipts_ghost_unfiled_updated_idx
  ON snaptax_receipts (ghost_id, updated_at DESC)
  WHERE (tax_season IS NULL OR tax_season = '' OR tax_season_date IS NULL)
    AND ghost_id IS NOT NULL;
```

- [ ] **Step 2: Sync `db/init-table.sql` + COMMENT ON**

- [ ] **Step 3: Run** `npx prisma migrate dev --name receipt_tax_season` (or create migration file manually per project convention)

---

### Task 3: API serialize + unfiled aggregate

**Files:**
- Modify: `lib/receipts/serialize.ts`
- Modify: `lib/client/receiptApi.ts`
- Modify: `app/api/receipts/route.ts`

- [ ] **Step 1: `serializeReceipt` add**

```typescript
taxSeason: r.taxSeason,
taxSeasonDate: r.taxSeasonDate?.toISOString() ?? null,
```

- [ ] **Step 2: `ApiReceipt` type add same fields**

- [ ] **Step 3: `apiReceiptToLocal` parse `taxSeasonDate`**

- [ ] **Step 4: GET aggregate**

```typescript
import { unfiledReceiptWhere } from "@/lib/receipts/filedStatus";

const agg = await prisma.snaptaxReceipt.aggregate({
  where: { ...where, status: "done", ...unfiledReceiptWhere() },
  _sum: { taxAmount: true },
});
```

- [ ] **Step 5: Export query filter** — tax pack export only **unfiled done** receipts (align with Est. Tax Saved):

```typescript
where: {
  userId: actor.userId,
  status: "done",
  ...unfiledReceiptWhere(),
},
```

---

### Task 4: Export marks receipts filed

**Files:**
- Modify: `app/api/export/tax-pack/route.ts`

- [ ] **Step 1: After workbook built, before response**

```typescript
const filedAt = utcNow();
await prisma.snaptaxReceipt.updateMany({
  where: { id: { in: receipts.map((r) => r.id) } },
  data: { taxSeason: season, taxSeasonDate: filedAt },
});
```

- [ ] **Step 2: Log meta** `taxSeason`, `receiptCount` per logging spec

---

### Task 5: Client types + unfiled tax sum

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/client/receiptApi.ts`

- [ ] **Step 1: `Receipt` interface**

```typescript
taxSeason?: string;
taxSeasonDate?: Date;
```

- [ ] **Step 2: Replace / alias `sumLocalTaxSaved`**

```typescript
import { isReceiptFiled } from "@/lib/receipts/filedStatus";

export function sumUnfiledLocalTaxSaved(receipts: Receipt[]): number {
  return receipts.reduce((sum, r) => {
    if (r.status !== "done" || r.taxAmount == null || isReceiptFiled(r)) return sum;
    return sum + r.taxAmount;
  }, 0);
}

/** @deprecated use sumUnfiledLocalTaxSaved or IDB sumUnfiledLocalTaxSavedIndexed */
export function sumLocalTaxSaved(receipts: Receipt[]): number {
  return sumUnfiledLocalTaxSaved(receipts);
}
```

---

### Task 6: IndexedDB v2

**Files:**
- Modify: `lib/storage/receiptDb.ts`

- [ ] **Step 1: Bump `DB_VERSION = 2`**

- [ ] **Step 2: Extend `SerializedReceipt` / row with `updatedAtMs`, `createdAtMs`, `isFiled`, `taxSeason`, `taxSeasonDateMs`**

- [ ] **Step 3: `onupgradeneeded`**

- Create indexes: `byUpdatedAt`, `byCreatedAt`, `byStatus`, `byStatusUpdatedAt`, `byFiledUpdatedAt`, `byFiledStatus`
- Migrate v1 rows: walk cursor, compute ms + `isFiled` via `filedFlag()`

- [ ] **Step 4: Update `serializeReceipt` / `deserializeReceipt` in IDB layer**

- [ ] **Step 5: New query functions**

```typescript
export const STARTUP_UNFILED_LIMIT = 30; // export from receiptSync instead — re-export OK

export async function loadRecentUnfiledReceipts(limit = 30): Promise<StoredReceipt[]>;
export async function loadTopByUpdatedAt(limit = 100): Promise<StoredReceipt[]>;
export async function sumUnfiledLocalTaxSavedIndexed(): Promise<number>;
export async function loadAllReceipts(): Promise<StoredReceipt[]>; // rename old loadReceipts
```

Implementation pattern for indexed read:

```typescript
function readIndexRange<T>(
  store: IDBObjectStore,
  indexName: string,
  range: IDBKeyRange,
  direction: IDBCursorDirection,
  limit: number,
): Promise<T[]>
```

- [ ] **Step 6: `saveReceipt` always refreshes `isFiled`, `updatedAtMs`, `createdAtMs`**

- [ ] **Step 7: Keep `loadReceipts` as alias → `loadAllReceipts` with `@deprecated` JSDoc for gradual caller migration

---

### Task 7: receiptSync constants + merge

**Files:**
- Modify: `lib/client/receiptSync.ts`
- Modify: `lib/client/receiptSync.test.ts`

- [ ] **Step 1: Constants**

```typescript
export const STARTUP_UNFILED_LIMIT = 30;
export const UI_RECEIPT_LIMIT = 100;
export const RECEIPT_SYNC_LIMIT = UI_RECEIPT_LIMIT;
```

- [ ] **Step 2: `unionMergeLWW` merge `taxSeason` / `taxSeasonDate` from remote when LWW applies**

- [ ] **Step 3: `persistMergedReceipts` compare filed fields for unchanged check**

- [ ] **Step 4: Test filed remote overwrites local when newer**

---

### Task 8: HomeScreen Phase 0 split

**Files:**
- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/OfflineHomeShell.tsx`

- [ ] **Step 1: Imports** — `loadRecentUnfiledReceipts`, `loadTopByUpdatedAt`, `sumUnfiledLocalTaxSavedIndexed`

- [ ] **Step 2: Replace startup effect**

```typescript
void (async () => {
  ensureTaxRegionCandidate();
  const hot = await loadRecentUnfiledReceipts(STARTUP_UNFILED_LIMIT);
  if (cancelled) return;
  setReceipts(hot);
  setSyncStuckIds(stuckIdsFromReceipts(hot));
  setTaxSaved(await sumUnfiledLocalTaxSavedIndexed());

  deferAfterPaint(async () => {
    const visible = await loadTopByUpdatedAt(UI_RECEIPT_LIMIT);
    if (cancelled) return;
    setReceipts(visible);
    setSyncStuckIds(stuckIdsFromReceipts(visible));
  });

  if (navigator.onLine) runDeferredStartup(() => cancelled);
})();
```

- [ ] **Step 3: `refreshTaxSaved`** — offline: `sumUnfiledLocalTaxSavedIndexed()` or filter with `sumUnfiledLocalTaxSaved(receipts)` on visible list only when API estimate unavailable (**never** sum filed rows)

- [ ] **Step 4: `syncFromServer` after merge** — reload `loadTopByUpdatedAt(100)` + `sumUnfiledLocalTaxSavedIndexed()`

- [ ] **Step 5: Mirror in `OfflineHomeShell`**

---

### Task 9: Verify

- [ ] **Step 1:** `node --import tsx --test lib/receipts/filedStatus.test.ts lib/client/receiptSync.test.ts`

- [ ] **Step 2:** `npm run build`

- [ ] **Step 3: Manual**

1. Seed IDB with mix filed/unfiled → cold start shows 30 unfiled max
2. Tax header excludes filed `done` rows
3. Export tax pack → receipts get `taxSeason` + date → tax total drops
4. DevTools IDB → no full `getAll` on startup (breakpoint in `loadAllReceipts` only on sync)

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| IDB v2 indexes | 6 |
| Startup 30 unfiled | 6, 8 |
| UI top 100 | 6, 8 |
| Sync 100 | 3, 7, 8 |
| Unfiled tax sum full corpus | 5, 6, 8 |
| PG columns + indexes | 2 |
| API aggregate | 3 |
| Export marks filed | 4 |
| LWW filed fields | 7 |

**Note:** `loadReceipts()` call sites outside HomeScreen must be migrated to indexed helpers or `loadAllReceipts` — grep before Task 9.
