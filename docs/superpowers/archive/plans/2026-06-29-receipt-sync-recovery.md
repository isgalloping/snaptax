# Receipt Sync, Recovery & 1.5y Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep local IndexedDB + OPFS as a 1.5-year working set in eventual consistency with PostgreSQL + Blob; restore meta + compressed images when local data is lost; reconcile non-done receipts; run background upload/merge when app is hidden (except iOS).

**Architecture:** New paginated `GET /api/receipts/sync` API. Client modules `localDataLoss`, `cloudRestoreFlow`, `reconcileNonDoneWindow`, `backgroundSyncGate`. Restore downloads images to OPFS for CPA export. Idle 18-month prune. Depends on Phase A summary rebuild hooks after restore/merge.

**Tech Stack:** Next.js Route Handler, Prisma, Vercel Blob signed URLs, IndexedDB, OPFS, Serwist PWA (no Background Sync API in MVP).

**Spec:** [`docs/superpowers/specs/2026-06-29-receipt-sync-recovery-design.md`](../specs/2026-06-29-receipt-sync-recovery-design.md)

**Prerequisite:** [`2026-06-29-receipt-summary-local.md`](./2026-06-29-receipt-summary-local.md) merged first

**Out of scope:** Soft-delete / undo delete · Background Sync API · OCR pipeline changes · done-lock merge (server wins on reconcile window only)

---

## File map

| File | Action |
|------|--------|
| `app/api/receipts/sync/route.ts` | **Create** — paginated 1.5y list |
| `app/api/receipts/reconcile/route.ts` | **Create** — bulk fetch by ids (optional alt: extend sync) |
| `lib/receipts/syncQuery.ts` | **Create** — since/cursor Prisma query |
| `lib/receipts/syncQuery.test.ts` | **Create** |
| `lib/client/localDataLoss.ts` | **Create** — detect empty local + session gate |
| `lib/client/cloudRestoreFlow.ts` | **Create** — paginated restore + image queue |
| `lib/client/cloudRestoreFlow.test.ts` | **Create** |
| `lib/client/reconcileNonDoneWindow.ts` | **Create** — 50-row non-done reconcile |
| `lib/client/reconcileNonDoneWindow.test.ts` | **Create** |
| `lib/client/backgroundSyncGate.ts` | **Create** — hidden flush + iOS guard |
| `lib/client/backgroundSyncGate.test.ts` | **Create** |
| `lib/client/platform/isIos.ts` | **Create** — iOS PWA detection |
| `lib/client/receiptRetention.ts` | **Create** — 18mo receipt prune |
| `lib/client/receiptRetention.test.ts` | **Create** |
| `components/settings/RestoreFromCloudSection.tsx` | **Create** — manual restore UI |
| `components/home/HomeScreen.tsx` | **Modify** — auto restore, hidden flush, reconcile schedule |
| `lib/client/receiptApi.ts` | **Modify** — `fetchReceiptSyncPage` |
| `docs/tech/03-api.md` | **Modify** — document sync API |

---

## Task 1: Paginated sync API (TDD)

**Files:**
- Create: `lib/receipts/syncQuery.ts`
- Create: `lib/receipts/syncQuery.test.ts`
- Create: `app/api/receipts/sync/route.ts`

- [ ] **Step 1: Write failing test for cursor pagination**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeSyncCursor, encodeSyncCursor } from "@/lib/receipts/syncQuery";

describe("syncQuery cursor", () => {
  it("round-trips updatedAt and id", () => {
    const c = encodeSyncCursor(new Date("2026-01-15T00:00:00.000Z"), "uuid");
    const d = decodeSyncCursor(c);
    assert.equal(d.id, "uuid");
    assert.equal(d.updatedAt.toISOString(), "2026-01-15T00:00:00.000Z");
  });
});
```

- [ ] **Step 2: Implement cursor + since default (18 months)**

```typescript
export const RECEIPT_SYNC_DEFAULT_SINCE_MONTHS = 18;

export function defaultSyncSince(now = new Date()): Date {
  const d = new Date(now);
  d.setMonth(d.getMonth() - RECEIPT_SYNC_DEFAULT_SINCE_MONTHS);
  return d;
}
```

- [ ] **Step 3: Implement route `GET /api/receipts/sync`**

Query params: `since`, `cursor`, `limit` (max 50).

Prisma:

```typescript
await prisma.snaptaxReceipt.findMany({
  where: {
    ...receiptWhereForActor(actor),
    capturedAt: { gte: since },
    ...(cursor ? { OR: [ /* keyset on updatedAt, id */ ] } : {}),
  },
  orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  take: limit + 1,
});
```

Response: `{ receipts, nextCursor, hasMore }`.

- [ ] **Step 4: Run tests + manual curl**

Run: `npm run test:unit -- lib/receipts/syncQuery.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/receipts/syncQuery.ts lib/receipts/syncQuery.test.ts app/api/receipts/sync/route.ts docs/tech/03-api.md
git commit -m "feat: add paginated receipt sync API for 1.5y restore"
```

---

## Task 2: Cloud restore flow

**Files:**
- Create: `lib/client/cloudRestoreFlow.ts`
- Create: `lib/client/cloudRestoreFlow.test.ts`
- Modify: `lib/client/receiptApi.ts`

- [ ] **Step 1: Write failing test — skips tombstoned ids**

Mock fetch pages; assert tombstone id not written to merge output.

- [ ] **Step 2: Implement `restoreReceiptsFromCloud`**

```typescript
export type RestoreProgress = { done: number; total: number | null };

export async function restoreReceiptsFromCloud(opts: {
  onProgress?: (p: RestoreProgress) => void;
  downloadImages?: boolean;
}): Promise<{ restoredCount: number }>;
```

Loop: `fetchReceiptSyncPage` until `hasMore=false` → merge each page via existing `unionMergeLWW` + `persistMergedReceipts`.

Image queue (max 3 concurrent):

```typescript
GET /api/receipts/:id/image → fetch → compress if needed → savePhotoCompressed
```

Skip if tombstone in `deleted_receipt_ids` OR remote 404 on delete check.

End: `rebuildCurrentSeasonSummary()`.

- [ ] **Step 3: Commit**

```bash
git add lib/client/cloudRestoreFlow.ts lib/client/cloudRestoreFlow.test.ts lib/client/receiptApi.ts
git commit -m "feat: add cloud restore flow with OPFS image download"
```

---

## Task 3: Local data loss detection + auto restore

**Files:**
- Create: `lib/client/localDataLoss.ts`

- [ ] **Step 1: Implement detection**

```typescript
export async function shouldAutoRestoreFromCloud(): Promise<boolean> {
  const receipts = await loadAllReceipts();
  if (receipts.length > 0) return false;
  const attempted = await readSystemMeta<string>("cloud_restore_attempted");
  if (attempted === "1") return false;
  return navigator.onLine; // actor check in caller after ensureGhostSession
}
```

- [ ] **Step 2: Wire in HomeScreen deferred startup**

After `ensureGhostSession`, if `shouldAutoRestoreFromCloud()` → `restoreReceiptsFromCloud({ downloadImages: true })` → write `cloud_restore_attempted=1`.

- [ ] **Step 3: Commit**

```bash
git add lib/client/localDataLoss.ts components/home/HomeScreen.tsx
git commit -m "feat: auto restore from cloud when local receipt store empty"
```

---

## Task 4: Settings manual restore UI

**Files:**
- Create: `components/settings/RestoreFromCloudSection.tsx`
- Modify: `components/settings/SettingsScreen.tsx`

- [ ] **Step 1: Add section with button + progress**

English UI strings:

- Button: `Restore from cloud`
- Progress: `Restoring {done}…`
- Success: `Restored {n} receipts`
- Offline: `Go online to restore`

Calls `restoreReceiptsFromCloud({ onProgress, downloadImages: true })`.

- [ ] **Step 2: Commit**

```bash
git add components/settings/RestoreFromCloudSection.tsx components/settings/SettingsScreen.tsx
git commit -m "feat: add manual restore from cloud in settings"
```

---

## Task 5: Non-done reconcile (50 window)

**Files:**
- Create: `lib/client/reconcileNonDoneWindow.ts`
- Create: `app/api/receipts/reconcile/route.ts` (POST `{ ids: string[] }`)

- [ ] **Step 1: Write failing test — pendingUpload skipped**

- [ ] **Step 2: Implement client reconcile**

```typescript
export const NON_DONE_RECONCILE_LIMIT = 50;

export async function reconcileNonDoneWindow(): Promise<number> {
  const local = await loadAllReceipts();
  const candidates = local
    .filter((r) => r.status !== "done")
    .sort((a, b) => receiptUpdatedAt(b).getTime() - receiptUpdatedAt(a).getTime())
    .slice(0, NON_DONE_RECONCILE_LIMIT);
  // fetch server rows for ids, server wins unless pendingUpload
}
```

- [ ] **Step 3: Schedule on foreground idle (≥30s) in HomeScreen**

- [ ] **Step 4: Commit**

```bash
git add lib/client/reconcileNonDoneWindow.ts app/api/receipts/reconcile/route.ts components/home/HomeScreen.tsx
git commit -m "feat: reconcile 50 non-done receipts with server"
```

---

## Task 6: Background sync gate (iOS exception)

**Files:**
- Create: `lib/client/platform/isIos.ts`
- Create: `lib/client/backgroundSyncGate.ts`

- [ ] **Step 1: Implement iOS detection**

```typescript
export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
```

- [ ] **Step 2: Implement `shouldRunHiddenBackgroundSync()`**

Returns `document.hidden && navigator.onLine && !isIos()`.

- [ ] **Step 3: Replace HomeScreen hidden guard**

Current 60s interval skips when hidden — **invert for non-iOS**:

```typescript
const retryPending = () => {
  if (!navigator.onLine) return;
  if (document.visibilityState === "hidden" && !shouldRunHiddenBackgroundSync()) return;
  void flushPendingUploadsRef.current();
  void flushPendingDeletesRef.current();
  if (document.visibilityState === "visible") {
    void reconcileNonDoneWindow();
  }
};
```

Keep `ProcessingReceiptWatcher` paused when hidden.

- [ ] **Step 4: Test + commit**

Run: `npm run test:unit -- lib/client/backgroundSyncGate.test.ts`

```bash
git add lib/client/platform/isIos.ts lib/client/backgroundSyncGate.ts components/home/HomeScreen.tsx
git commit -m "feat: background upload on hidden except iOS"
```

---

## Task 7: 18-month local retention

**Files:**
- Create: `lib/client/receiptRetention.ts`

- [ ] **Step 1: Write failing test — keeps pendingUpload**

- [ ] **Step 2: Implement prune**

```typescript
export const RECEIPT_RETENTION_MONTHS = 18;

export async function pruneReceiptsOlderThanRetention(
  now = new Date(),
): Promise<number> {
  const cutoff = /* now - 18 months */;
  for (const row of await loadAllReceipts()) {
    if (row.pendingUpload) continue;
    if (row.timestamp >= cutoff) continue;
    await deleteReceipt(row.id);
  }
}
```

Also prune stale tombstones older than cutoff.

Schedule alongside `schedulePhotoRetentionPurge`.

- [ ] **Step 3: Commit**

```bash
git add lib/client/receiptRetention.ts components/home/HomeScreen.tsx
git commit -m "feat: prune local receipts older than 18 months on idle"
```

---

## Task 8: Integration acceptance

- [ ] **Step 1: Clear IDB, login, verify auto restore + OPFS files**
- [ ] **Step 2: Delete online — verify NOT restored on next restore**
- [ ] **Step 3: Android/desktop hidden tab — verify upload continues (manual)**
- [ ] **Step 4: iOS — verify no upload while hidden (manual or UA mock)**
- [ ] **Step 5: `npm run test:unit` full suite**

---

## Spec coverage checklist

| Spec § | Task |
|--------|------|
| G1 delete not recoverable | Task 2 skip tombstone/404 |
| G2 restore 1.5y + OPFS | Task 1–4 |
| G3 50 non-done reconcile | Task 5 |
| G4 18mo retention | Task 7 |
| G5 background C + iOS | Task 6 |
| G6 summary rebuild | Task 2 end |

---

## Acceptance

1. Local empty + logged in → auto restore with OPFS images  
2. Settings manual restore with progress  
3. Successful delete not resurrected  
4. Non-done drift fixed on idle reconcile  
5. iOS no hidden flush; Android/desktop allows it  
6. Local rows >18mo pruned on idle
