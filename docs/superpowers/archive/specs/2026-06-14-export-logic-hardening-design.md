# Export Logic Hardening — Design

**Date:** 2026-06-14  
**Status:** Approved  
**Scope:** Pre-export sync, server receipt query scope, paid-cache correctness, client/server tax-year count alignment.

**Related:** `docs/superpowers/specs/2026-06-11-export-optimization-bugfix-design.md`, `docs/tech/08-export.md`, `lib/receipts/accountCleanup.ts`

---

## 1. Background

Export is the sole paid conversion path ($49/season). Prior work fixed B1 (Export Again includes all `done` receipts), B2 (post-payment entitlement poll), B7/B8 (NO_RECEIPTS + share cancel), O2/O3 (offline check + post-export sync).

Code audit found four remaining logic gaps:

| ID | Symptom | Root cause |
|----|---------|------------|
| E1 | UI shows receipts; POST returns `NO_RECEIPTS` or partial pack | Export opens without `flushPendingUploads` / sync (login path has it; export path does not) |
| E2 | Bound-ghost receipts missing from export | `tax-pack` route queries `{ userId }` only; account delete uses `userAccountReceiptFilter` (userId OR bound ghostId) |
| E3 | Step 1 year count ≠ server export set | `ExportEngineSheet` counts local IndexedDB; server filters DB after optional unsynced pending rows |
| E5 | Settings shows "Export Again"; POST 402 | `refreshSeasonPaid` never clears localStorage when API returns `paid=false`; gate falls back to stale `seasonPaid` on fetch error |

**Out of scope (this pass):** E6 category-review PATCH failure bypass (P2); `currentTaxSeason()` May–Dec season label (product decision).

---

## 2. Approach

**Chosen:** Unified export-prepare flow (方案 2) — one `prepareExportSync` helper shared by gate and generate, server query reuses `userAccountReceiptFilter`.

**Rejected:**

- Scatter patches — E1/E3 coupled, duplicated sync calls.
- Sync-only-at-generate — Step 1 counts stay stale until failure.

---

## 3. E1 + E3 — Client export prepare

### 3.1 New module: `lib/client/exportPrepareFlow.ts`

```typescript
export async function prepareExportSync(opts: {
  flushPendingUploads: () => Promise<void>;
  flushPendingDeletes: () => Promise<void>;
  loadAllReceipts: () => Promise<StoredReceipt[]>;
  syncFromServer: (
    local: StoredReceipt[],
    mode: "immediate",
  ) => Promise<Receipt[]>;
  ensureGhostSession: () => Promise<void>;
}): Promise<Receipt[]>
```

**Order (matches `handlePostLoginSync`, without tax-recalc poll):**

1. If `!navigator.onLine` → throw `EXPORT_OFFLINE`
2. `ensureGhostSession()`
3. `flushPendingUploads()` → `flushPendingDeletes()`
4. `loadAllReceipts()` → `syncFromServer(local, "immediate")`
5. Return merged `Receipt[]`

Idempotent; safe to call at gate open and again at generate.

### 3.2 Integration points

| Hook | When | Behavior |
|------|------|----------|
| `HomeScreen.handlePreExportSync` | Passed into gate | Wraps refs: `flushPendingUploadsRef`, `flushPendingDeletesRef`, `syncFromServer`; updates `receipts` state via sync `immediate` merge |
| `useTaxExportGate.runExportGate` | Before `openExportEngine()` | `await onPreExportPrepare()`; on `EXPORT_OFFLINE` set error, do not open sheet |
| `useTaxExportGate.handleGoogleSuccess` | After login, before paywall/engine | Same prepare when paid |
| `ExportEngineSheet.handleGenerate` | Before `exportTaxPack()` | `await onPreExportPrepare?.()` (second pass) |

### 3.3 UX / loading state

- `useTaxExportGate`: new `preparingExport` boolean, set around prepare calls.
- `HomeScreen`: `exportBusy={taxExport.paywallExporting || taxExport.preparingExport}`.
- Settings export button disabled + busy label while preparing (reuse existing `exportBusy` prop).

**E3 outcome:** `ExportEngineSheet` receives post-sync `receipts` prop; `yearReceipts.length` aligns with server `filterReceiptsByTaxYear` + `X-Time-Zone`.

---

## 4. E2 — Server export query scope

**File:** `app/api/export/tax-pack/route.ts`

Replace narrow `{ userId: actor.userId, status: "done" }` with:

```typescript
const binding = await prisma.snaptaxGhostAccount.findUnique({
  where: { userId: actor.userId },
  select: { ghostId: true },
});

const allReceipts = await prisma.snaptaxReceipt.findMany({
  where: {
    ...userAccountReceiptFilter(actor.userId, binding?.ghostId ?? null),
    status: "done",
  },
  orderBy: { capturedAt: "asc" },
});
```

- Use **DB-bound** `ghostId`, not cookie `actor.ghostId` (rebind / new device cookie may differ).
- Aligns with `deleteUserAccount` and `docs/tech/08-export.md` §8.6 (all `done` receipts for the Google account).

**Not changed:** `receiptWhereForActor` for list APIs (still `userId`-only window query).

---

## 5. E5 — Paid cache (B5 completion)

### 5.1 `refreshSeasonPaid` (`lib/client/useAuthSession.ts`)

Always mirror API truth into localStorage:

```typescript
setSeasonPaidState(paid);
setSeasonPaid(season, paid); // removes key when paid=false
```

### 5.2 Gate paid check (`useTaxExportGate`)

```typescript
let paid = false;
if (navigator.onLine) {
  paid = await fetchSeasonPaid(currentSeason).catch(() => false);
  setSeasonPaid(currentSeason, paid);
} else {
  paid = isSeasonPaid(currentSeason);
}
```

Remove `.catch(() => seasonPaid)` stale-true fallback.

### 5.3 Sign-out hygiene

On `signOut`: clear current season localStorage paid flag (`setSeasonPaid(seasonKey(), false)`) so next Ghost on same device does not inherit paid UI.

---

## 6. Error handling

| Scenario | Client behavior |
|----------|-----------------|
| Prepare while offline | Gate: `copy.settings.export.offline`, no sheet |
| Prepare throws (ghost/session) | Gate: generic export error |
| Generate prepare fails | Return to format step + failed message |
| POST 422 `NO_RECEIPTS` | Existing dedicated copy (edge: all rows still pending after flush) |
| POST 402 | Close sheet → open Paywall (unchanged) |

---

## 7. Tests

| File | Coverage |
|------|----------|
| `lib/client/exportPrepareFlow.test.ts` | Call order (flush upload → flush delete → sync); offline throws `EXPORT_OFFLINE` |
| `lib/client/useAuthSession.test.ts` | `refreshSeasonPaid` with `paid=false` removes localStorage key |
| `lib/receipts/accountCleanup.test.ts` | Optional: document export where = filter + `status: "done"` |

**Verification:** `npm run test:unit` and `npm run build` pass.

---

## 8. Files touched

| File | Change |
|------|--------|
| `lib/client/exportPrepareFlow.ts` | **New** |
| `lib/client/exportPrepareFlow.test.ts` | **New** |
| `lib/client/useAuthSession.ts` | E5 cache + sign-out clear |
| `lib/client/useAuthSession.test.ts` | **New** |
| `components/export/useTaxExportGate.tsx` | Prepare hook, `preparingExport`, paid check |
| `components/export/ExportEngineSheet.tsx` | `onPreExportPrepare` before generate |
| `components/home/HomeScreen.tsx` | `handlePreExportSync`, `exportBusy` |
| `app/api/export/tax-pack/route.ts` | `userAccountReceiptFilter` |

---

## 9. Acceptance criteria

1. User with pending local uploads: Export gate waits for flush+sync; Step 1 count matches exported row count header.
2. User with `userId=null` receipts on bound ghost: included in export ZIP/CSV.
3. Entitlement revoked server-side: refresh/gate clears localStorage; UI shows paywall, not false "Export Again".
4. Export Again still includes all `done` receipts (B1 regression-free).
5. Unit tests + build green.
