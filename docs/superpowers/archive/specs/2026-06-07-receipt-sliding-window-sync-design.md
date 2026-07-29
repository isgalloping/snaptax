# Receipt Sliding-Window Sync — Design

**Date:** 2026-06-07  
**Status:** Approved  

## Summary

Local-first startup; async merge of server **top 100 by `updatedAt`**; **no sync deletes**; LWW conflict resolution; UI shows top 100 by `updatedAt`; older local rows stay in IndexedDB.

## Decisions

| Topic | Choice |
|-------|--------|
| History beyond window | **A** — sliding window; no server fetch for older-only rows |
| Delete on sync | **None** — union + upsert only |
| Startup | IndexedDB → display top 100 local; network deferred |
| Sync window | 100 rows, `updatedAt desc` |
| Conflicts | LWW by `updatedAt`; `pendingUpload` local wins |
| `taxSavedEstimate` | Full aggregate (not windowed) |

## Architecture

```
Phase 0: loadReceipts → top100ByUpdatedAt → UI
Phase 2: fetchReceiptList(100) → unionMergeLWW → persist upsert → top100 → apply
```

## API

- `GET /api/receipts?limit=100&orderBy=updatedAt`
- Response includes `updatedAt` per receipt
- Indexes on `(user_id, updated_at)` and `(ghost_id, updated_at)`

## Client

- `StoredReceipt.updatedAt` — migrate from `timestamp` when missing
- Remove `pruneLocalReceiptsNotOnServer`
- `unionMergeLWW` + `top100ByUpdatedAt`

## Acceptance

1. Cold start shows local top 100 without network
2. Phase 2 merges server window without deleting local
3. AI completion bumps `updatedAt` → rises in list
4. Header tax total remains full sum
5. `npx next build` passes
