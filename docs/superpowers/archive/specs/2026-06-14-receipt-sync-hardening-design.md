# Receipt Sync Hardening — Design

**Date:** 2026-06-14  
**Status:** Approved  
**Scope:** Fix list shrink, stuck processing, and sync contradictions from window-based prune + list polling.

## Problems

| ID | Symptom | Root cause |
|----|---------|------------|
| S1 | List shrinks after sync/login | Signed-in prune treated top-100 `GET /api/receipts` as full server set |
| S2 | Processing stuck forever | Watcher finds active id via list window; missing → `unwatch` |
| S3 | Spec conflict | Sliding-window spec: no sync deletes; delete-hardening added window prune |

## Solution

### 1. Remove window-based prune

- Drop `pruneLocalSyncedAbsentFromRemote` from `syncFromServer`
- Deletion convergence: tombstones + `flushPendingDeletes` only
- Multi-device: LWW merge; remote deleted rows not re-imported

### 2. Watcher single-receipt poll

- Active id: `GET /api/receipts/:id` (404 → unwatch)
- On settle (done/blurry): one `GET /api/receipts` for `taxSavedEstimate`

### 3. Extract `mergeServerReceiptsIntoLocal`

- `lib/client/receiptSyncOrchestrator.ts`
- Tombstone filter → `unionMergeLWW` → `persistMergedReceipts` → top-100 visible

## Files

| File | Change |
|------|--------|
| `lib/client/receiptSyncOrchestrator.ts` | **New** |
| `lib/client/processingReceiptWatcher.ts` | Single-receipt GET |
| `lib/client/receiptApi.ts` | `fetchReceiptByIdIfExists` |
| `components/home/HomeScreen.tsx` | Use orchestrator; remove prune |
| Tests | orchestrator + watcher deps |

## Acceptance

1. 120+ server receipts: sync does not delete local rows outside top-100 window
2. Processing receipt outside window: watcher still settles
3. Tombstone + delete flush still prevent resurrection
4. `npm run build` + `npm run test:unit` pass
