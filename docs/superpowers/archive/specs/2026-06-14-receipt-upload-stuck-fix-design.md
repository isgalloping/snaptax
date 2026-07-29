# Receipt Upload Stuck (UPLOADING) — Design

**Date:** 2026-06-14  
**Status:** Approved  
**Scope:** Fix production receipts stuck on UPLOADING forever without reaching Upload paused.

## Problem

Users on production see receipts permanently in **UPLOADING...** (`pendingUpload: true`, budget not exhausted).

Root causes in code:

| Cause | Behavior |
|-------|----------|
| `loadPhoto` returns null | `uploadPendingInner` silently returns; no budget decrement, no UI change |
| `loadPhoto` throws (decrypt) | Swallowed by flush loop; no budget decrement |
| `POST` 201 then `GET /api/receipts/:id` fails | Upload treated as failed; may duplicate on retry |
| DB created before Blob `put` | Blob fail → orphan DB row |
| `flushPendingUploads` skips `ensureGhostSession` | Intermittent 401 on interval retry |

## Goals

1. No silent infinite UPLOADING state.
2. Upload success does not depend on a second GET.
3. Server avoids orphan DB rows when Blob fails.
4. Flush always has valid ghost session before writes.

## Non-Goals

- Server-side idempotency / `clientReceiptId` dedup (future)
- Async upload queue redesign

---

## §1 Client — photo load failures

`uploadPendingInner`:

- Wrap `loadPhoto` in try/catch.
- On null or error → persist `photoMissing: true`, `writeBudgetRemaining: 0`, keep `pendingUpload: true`.
- Add id to `syncStuckIds`.

UI (`ReceiptListCard`, `ReceiptDetailSheet`):

- `photoMissing + pendingUpload` → **Photo missing · Tap to resnap** (not Tap to retry).
- Tap → `onResnap` (not `onRetrySync`).
- Clear `photoMissing` on successful resnap/upload.

---

## §2 Client — `uploadReceipt` without fragile GET

`POST /api/receipts` 201 body includes `id`, `status`, `taxAmount`, `dataRegion`.

- Map 201 body → `ApiReceipt` via `apiReceiptFromUploadResponse`.
- Optional `fetchReceiptById` only if body incomplete (defensive).

---

## §3 Client — flush ghost session

`flushPendingUploads` calls `ensureGhostSession()` at start (same as deferred startup).

---

## §4 Server — Blob before DB

`POST /api/receipts` order:

```
validate → put Blob → create DB(processing) → try processReceiptTax
```

Blob failure → 500, no DB row. OpenAI failure → unchanged 201 processing.

---

## §5 Files

| File | Change |
|------|--------|
| `lib/client/receiptApi.ts` | `apiReceiptFromUploadResponse`; upload uses 201 body |
| `lib/client/receiptUploadFlow.ts` | **New** — `applyPhotoMissingState` helper |
| `components/home/HomeScreen.tsx` | photo missing handling; flush ghost ensure |
| `components/home/ReceiptListCard.tsx` | photo missing copy + resnap tap |
| `components/receipts/ReceiptDetailSheet.tsx` | photo missing copy |
| `lib/types.ts` | `photoMissing?: boolean` |
| `app/api/receipts/route.ts` | Blob before DB |
| `lib/i18n/*` | list copy for photo missing |
| `lib/client/receiptApi.test.ts` | upload response mapping |
| `lib/client/receiptUploadFlow.test.ts` | photo missing helper |

---

## §6 Acceptance

| Case | Expected |
|------|----------|
| Receipt row without photo | Photo missing UI; tap resnap; not infinite UPLOADING |
| POST 201, GET fails | Local id swap succeeds from 201 body |
| Blob misconfigured | 500; budget decrements → Upload paused after 5 |
| Normal online snap | Upload + analyze as before |
