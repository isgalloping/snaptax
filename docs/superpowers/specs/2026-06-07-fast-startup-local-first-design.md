# Fast Startup — Local-First Receipts — Design

**Date:** 2026-06-07  
**Status:** Approved (design)  
**Scope:** Show receipt list from IndexedDB immediately; defer ghost + server sync; never block Snap after UI gate; defer silent merge while camera is open.

## Problem

Online cold start blocks the UI on `ensureGhostSession` + `fetchReceiptList` before `setHydrated(true)`. Users see a long Loading screen and cannot snap receipts until server round-trips complete.

## Decisions

| Topic | Choice |
|-------|--------|
| Loading gate | **C** — IndexedDB receipts ready for display; **auth still waits** on `fetchAuthMe` |
| Server merge | **D** — silent merge; **defer** if camera open until camera closes |
| Ghost session | **A** — deferred with Phase 2 sync; `handleCapture` awaits on demand |

## Architecture

```
Phase 0 (parallel with auth)
  loadReceipts → setReceipts + local tax + syncStuckIds → receiptsLocalReady

UI gate: receiptsLocalReady && auth.hydrated → home UI (Snap enabled)

Phase 2 (deferred, rAF×2)
  ensureGhostSession → flushPendingUploads → syncFromServer
  → applyServerMergeOrDefer (queue if cameraOpen)

handleCapture (online): ensureGhostSession on demand — unchanged
Manual refresh: immediate merge — no defer
```

## Phase 0 — Local first

- Run `loadReceipts()` for both online and offline
- Set state from IndexedDB immediately
- Use `sumLocalTaxSaved` until API estimate arrives
- **Do not** call `ensureGhostSession` or `fetchReceiptList` before UI gate

## UI gate

Replace single `hydrated` blocked on network with:

- `receiptsLocalReady` — true after IndexedDB load
- Show Loading while `!receiptsLocalReady || !auth.hydrated`

## Phase 2 — Background sync

Existing `runDeferredStartup` after UI visible:

1. `ensureGhostSession()`
2. `flushPendingUploads()`
3. `syncFromServer()` → merge
4. `ProcessingQueue.bootstrapFromList`

## Silent merge + camera defer

```typescript
if (cameraOpen) pendingMergeRef.current = { receipts, taxEstimate };
else apply merge to state immediately;
```

On `cameraOpen` → `false`: flush pending merge.

**Defer only for `cameraOpen`**, not detail sheet or settings.

Manual `handleManualListSync` / header refresh: always immediate merge.

## Auth

`useAuthSession` unchanged — online still awaits `fetchAuthMe` before `auth.hydrated`.

## Spec updates

- `background-polling-policy-design.md` — Phase 1: IndexedDB only; network in Phase 2
- `06-receipt-ai-pipeline.md` §6.5
- `PRODUCT-SPEC.md` §2.2

## Testing

1. Online cold start: Loading duration ≈ max(IndexedDB, auth), not list fetch
2. Home shows local receipts immediately after gate
3. Snap works without waiting for Phase 2
4. List silently updates after background sync
5. Open camera during sync: no list jump until camera closes
6. `npm run build` passes
