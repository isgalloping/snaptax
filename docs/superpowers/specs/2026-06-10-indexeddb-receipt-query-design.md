# IndexedDB Receipt Query + Tax-Season Filed Filter — Design

**Date:** 2026-06-10  
**Status:** Approved (design)  
**Scope:** IDB v2 indexed queries; startup hot load; unfiled-only tax stats; server schema alignment.

**Store 命名（Canonical）：** object store 一律 `snaptax_*` 前缀 — 见 [`DB-DESIGN-SPEC.md`](../../tech/DB-DESIGN-SPEC.md) §2.2。本文档中的 `receipts` / `photos` 指 **legacy v4** 名，v5 迁移后为 `snaptax_receipts` / `snaptax_receipt_photos`。

**Supersedes (partial):** [`2026-06-07-receipt-sliding-window-sync-design.md`](./2026-06-07-receipt-sliding-window-sync-design.md) — window sizes + tax aggregate rules updated.

---

## Problem

1. `loadReceipts()` uses `getAll()` + in-memory sort — slow as local corpus grows.
2. Startup loads entire IDB before UI; no indexed “recent N” path.
3. **Est. Tax Saved** sums all `done` receipts; product requires **excluding filed (已报税) rows**.
4. Cold start should surface **recent 30 unfiled** rows, not arbitrary recent 30.
5. Server `snaptax_receipts` lacks `tax_season` / `tax_season_date` for per-receipt filed state.

---

## Decisions

| Topic | Choice |
|-------|--------|
| IDB corpus | **Full retention** — no sliding delete |
| Startup memory | **30 unfiled** rows by `updatedAt` desc (indexed) |
| UI list | **Top 100** by `updatedAt` desc — **unchanged** (includes filed + unfiled) |
| Background sync | Server **top 100** by `updatedAt`; LWW merge |
| Tax saved (local + API) | `SUM(tax_amount)` where `status=done` **AND unfiled** — **full corpus**, not windowed |
| Filed rule | **`tax_season` AND `tax_season_date` both non-empty** → filed → **exclude** from tax sum |
| Unfiled | Either field missing/null/empty string |
| IDB schema | **v2** — numeric ms fields + indexes |
| Server | Add columns + indexes; API returns new fields; aggregate excludes filed |

---

## Filed semantics

```typescript
/** lib/receipts/filedStatus.ts */
export function isReceiptFiled(row: {
  taxSeason?: string | null;
  taxSeasonDate?: Date | null;
}): boolean {
  const season = row.taxSeason?.trim();
  return Boolean(season && row.taxSeasonDate);
}
```

| `tax_season` | `tax_season_date` | Meaning |
|--------------|-------------------|---------|
| null/empty | null | Unfiled — **in** tax sum (if done) |
| `"2026"` | null | Unfiled |
| null | set | Unfiled (both required) |
| `"2026"` | `2026-04-01T…Z` | **Filed** — exclude from tax sum; still in IDB + optional UI list |

**Write path (future in same epic):** successful **Export tax pack** marks exported receipts with current season + `utcNow()` as `tax_season_date`. Until export runs, all legacy rows remain unfiled.

---

## Server — PostgreSQL

### New columns (`snaptax_receipts`)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `tax_season` | `VARCHAR(255)` | YES | e.g. `"2026"` |
| `tax_season_date` | `TIMESTAMPTZ(3)` | YES | UTC instant when marked filed |

Sync: `db/init-table.sql`, `prisma/schema.prisma`, `04-data-model.md`, new migration.

### New indexes

Partial indexes for **unfiled** hot paths (actor-scoped):

```sql
-- user_id path
CREATE INDEX snaptax_receipts_user_unfiled_updated_idx
  ON snaptax_receipts (user_id, updated_at DESC)
  WHERE (tax_season IS NULL OR tax_season = '' OR tax_season_date IS NULL);

-- ghost_id path
CREATE INDEX snaptax_receipts_ghost_unfiled_updated_idx
  ON snaptax_receipts (ghost_id, updated_at DESC)
  WHERE (tax_season IS NULL OR tax_season = '' OR tax_season_date IS NULL)
  AND ghost_id IS NOT NULL;
```

Existing `(user_id|ghost_id, updated_at DESC)` indexes remain for **top-100 list** (all rows).

### API changes

**`GET /api/receipts`**

- Each receipt includes `taxSeason`, `taxSeasonDate` (ISO UTC or null).
- `taxSavedEstimate` = aggregate **unfiled done only**:

```typescript
where: {
  ...actorWhere,
  status: "done",
  OR: [
    { taxSeason: null },
    { taxSeason: "" },
    { taxSeasonDate: null },
  ],
}
```

**`PATCH /api/receipts/[id]` or export batch** (export epic): set `tax_season` + `tax_season_date` on filed rows.

---

## Client — IndexedDB v2

### Row shape (`ReceiptRow`)

```typescript
interface ReceiptRow {
  id: string;
  status: ReceiptStatus;
  updatedAtMs: number;
  createdAtMs: number;       // snap/captured event
  isFiled: 0 | 1;            // denormalized for indexes
  taxSeason?: string;
  taxSeasonDateMs?: number;    // UTC ms; undefined if unfiled
  taxAmount?: number;
  pendingUpload?: boolean;
  writeBudgetRemaining?: number;
  // …remaining Receipt fields
}
```

On every `put`, compute `isFiled` from `taxSeason` + `taxSeasonDateMs`.

### Indexes (`receipts` store)

| Index | keyPath | Use |
|-------|---------|-----|
| `byUpdatedAt` | `updatedAtMs` | UI top-100 (all rows) |
| `byCreatedAt` | `createdAtMs` | Created-time queries |
| `byStatus` | `status` | Status filter |
| `byStatusUpdatedAt` | `[status, updatedAtMs]` | e.g. processing queue |
| `byFiledUpdatedAt` | `[isFiled, updatedAtMs]` | **Startup 30 unfiled** (`isFiled=0`) |
| `byFiledStatus` | `[isFiled, status]` | **Full unfiled tax sum** (`0`, `done`) |

`photos` store unchanged.

### Query API (`lib/storage/receiptDb.ts`)

| Function | Behavior |
|----------|----------|
| `loadRecentUnfiledReceipts(30)` | `byFiledUpdatedAt` cursor: `isFiled=0`, `prev`, limit 30 — **startup Phase 0** |
| `loadTopByUpdatedAt(100)` | `byUpdatedAt` cursor `prev`, limit 100 — **UI list** |
| `queryByStatus(status, opts?)` | `byStatus` / compound |
| `sumUnfiledLocalTaxSaved()` | `byFiledStatus` range `[0, done]` → sum `taxAmount` — **full IDB** |
| `loadReceipt(id)` | point get |
| `loadAllReceipts()` | full scan — **sync merge / export only**; not startup |

Constants (`lib/client/receiptSync.ts`):

```typescript
export const STARTUP_UNFILED_LIMIT = 30;
export const UI_RECEIPT_LIMIT = 100;      // was RECEIPT_SYNC_LIMIT
export const RECEIPT_SYNC_LIMIT = 100;    // alias for API
```

Deprecate startup use of `loadReceipts()` + `top100` sort for hot path.

---

## Startup & sync flow

```
Landing: warmReceiptDb() → open/migrate v2

Phase 0-fast (local, no network)
  loadRecentUnfiledReceipts(30) → setReceipts (initial paint)
  sumUnfiledLocalTaxSaved()     → taxSaved header (full unfiled corpus)
  receiptsLocalReady = true

Phase 0-full (local, rAF)
  loadTopByUpdatedAt(100)       → expand UI list (all statuses/filed mix)

Phase 2 (deferred, online)
  fetchReceiptList(100)
  unionMergeLWW (pendingUpload wins; LWW on updatedAtMs; merge taxSeason fields)
  persistMergedReceipts (upsert only deltas)
  loadTopByUpdatedAt(100) + sumUnfiledLocalTaxSaved() → refresh UI
```

**Tax header online:** prefer API `taxSavedEstimate` (unfiled aggregate); offline use `sumUnfiledLocalTaxSaved()`.

**UI list:** top 100 by `updatedAt` — **not** filtered to unfiled (unchanged UX).

**Startup 30:** **unfiled only** — may be subset shown briefly before Phase 0-full expands to 100; first paint prioritizes active (unfiled) work.

---

## Consistency (LWW + filed fields)

| Case | Rule |
|------|------|
| Local `pendingUpload` | Keep local; skip remote overwrite |
| Remote `updatedAt` newer | Merge row; update `taxSeason` / `taxSeasonDate` from server |
| Local filed, remote unfiled | LWW by `updatedAtMs`; newer wins |
| Export marks filed locally | Upsert IDB; next sync pushes to server (batch API) |

No delete-on-sync; window外 rows stay in IDB.

---

## Migration

### IDB v1 → v2

1. `DB_VERSION = 2`
2. `onupgradeneeded`: add indexes; walk existing rows → set `updatedAtMs`, `createdAtMs`, `isFiled`, optional `taxSeason*` (default unfiled)
3. No data loss

### PostgreSQL

1. Prisma migration add nullable columns
2. Backfill: all existing rows unfiled (NULL,NULL)
3. Deploy API + client together (tolerant of missing fields on old clients)

---

## Module map

| File | Change |
|------|--------|
| `lib/receipts/filedStatus.ts` | **New** — `isReceiptFiled`, `unfiledPrismaWhere` helper |
| `lib/storage/receiptDb.ts` | v2 schema, indexes, query API |
| `lib/types.ts` | `taxSeason?`, `taxSeasonDate?` on `Receipt` |
| `lib/client/receiptApi.ts` | `sumUnfiledLocalTaxSaved`; API types |
| `lib/client/receiptSync.ts` | constants; merge filed fields |
| `lib/receipts/serialize.ts` | expose new fields |
| `app/api/receipts/route.ts` | unfiled aggregate; serialize |
| `app/api/export/tax-pack/route.ts` | mark receipts filed (same season) |
| `components/home/HomeScreen.tsx` | Phase 0-fast/full |
| `prisma/schema.prisma` + `db/init-table.sql` | columns + indexes |
| `docs/superpowers/specs/2026-06-07-tax-savings-regional-design.md` | note unfiled aggregate (cross-ref) |

---

## Acceptance

1. Cold start: IDB read **≤30 unfiled** rows for first paint (no `getAll`).
2. UI list shows **100** rows max by `updatedAt` (filed + unfiled).
3. Est. Tax Saved = **full local unfiled done** sum; filed receipt excluded after both fields set.
4. Startup 30 rows are all **unfiled** (`isFiled=0`).
5. Server `taxSavedEstimate` matches unfiled rule.
6. `queryByStatus('processing')` uses index.
7. v1→v2 IDB migration preserves data; PG migration nullable backfill.
8. `npm run build` passes.

---

## Out of scope

- Paginated browse of full IDB history in UI
- Per-season filed analytics dashboard
- Changing UI list to hide filed receipts (unless product revises)

---

## Related

- [`2026-06-07-fast-startup-local-first-design.md`](./2026-06-07-fast-startup-local-first-design.md)
- [`2026-06-07-tax-savings-regional-design.md`](./2026-06-07-tax-savings-regional-design.md)
- [`docs/tech/DB-DESIGN-SPEC.md`](../tech/DB-DESIGN-SPEC.md)
