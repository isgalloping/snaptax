# Receipt Delete Hardening — Design

**Date:** 2026-06-14  
**Status:** Approved  
**Scope:** Fix zombie resurrection, multi-device stale rows, Blob orphans, and missing delete retry.

## Problems (audit)

| ID | Issue |
|----|--------|
| G1 | Remote delete fails silently → `syncFromServer` re-imports receipt |
| G2 | Device B keeps local row after device A deletes on server |
| G3 | `DELETE /api/receipts/:id` removes DB only, not Blob |
| G4 | No offline delete retry queue |
| G5 | Batch review delete local-only |

## Solution (Scheme A)

### Client tombstones

- IDB `system_meta` key `deleted_receipt_ids: string[]`
- On delete persisted UUID: add tombstone before local delete
- `syncFromServer`: filter remote rows in tombstone set
- `flushPendingDeletes`: retry `DELETE` until 204/404, then remove tombstone
- Triggers: mount defer, `online`, 60s interval (tab visible)

### Signed-in prune

When `fetchAuthMe().user != null` and `remote.length > 0`:

- Delete local rows where: persisted id, not `pendingUpload`, not in `remoteIds`

### Server DELETE

`deleteReceiptBlobs([imageUrl])` → warn on fail → `prisma.delete`

### Batch review

`onReviewDelete` → same path as `handleDeleteReceipt` (tombstone + remote)

## Files

| File | Change |
|------|--------|
| `lib/client/receiptDeleteTombstones.ts` | **New** |
| `lib/client/receiptDeleteFlow.ts` | **New** |
| `lib/client/receiptSync.ts` | `filterRemoteByTombstones`, `pruneLocalSyncedAbsentFromRemote` |
| `components/home/HomeScreen.tsx` | unified delete, flush, sync prune |
| `app/api/receipts/[id]/route.ts` | Blob cleanup |
| Tests | tombstones, prune, filter |

## Acceptance

1. Offline delete → no resurrection after sync when online flush succeeds
2. DELETE failure → tombstone blocks re-merge until retry succeeds
3. Signed-in multi-device → prune removes stale local rows
4. Server DELETE removes Blob (warn if Blob fails)
5. Batch review delete uses full delete path
