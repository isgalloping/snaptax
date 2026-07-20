# Receipt Upload & OpenAI Pipeline Resilience — Design

**Date:** 2026-06-07  
**Status:** Approved (design)  
**Scope:** Fix synchronous upload + OpenAI pipeline for failure recovery and offline→online resume.  
**Approach:** 方案 1 — server graceful degradation + client `/process` retry.

## Problem

Current implementation diverges from `docs/tech/06-receipt-ai-pipeline.md`:

| Gap | Impact |
|-----|--------|
| OpenAI failure during `POST /api/receipts` returns 503 | Client treats upload as failed; DB may already have `processing` + Blob |
| Client never calls `POST /api/receipts/:id/process` | Stuck `processing` receipts never retry Vision |
| `flushPendingUploads` only on `online` event | Pending receipts not uploaded when app opens already online |
| Failed pending upload silent, no retry | Queue stuck until offline→online cycle |
| `syncFromServer` does not resume poll/process | Server-side `processing` ignored after refresh |

## Goals

1. Upload + Blob persist even when OpenAI fails → receipt stays `processing`.
2. Client automatically retries analysis via `/process` on mount, poll timeout, and user tap.
3. Offline captures flush when app opens online or network returns.
4. No API schema / DB migration changes.

## Non-Goals

- Async QStash/Inngest queue (方案 B in pipeline doc)
- Converting stuck `processing` to `blurry` on AI failure
- New server-side scheduled retry worker

---

## Server Design

### `POST /api/receipts`

Flow unchanged until after Blob `put`:

```
create DB(processing) → put Blob → try processReceiptTax
```

| Outcome | HTTP | Body |
|---------|------|------|
| Vision success | 201 | `{ id, status: "done"\|"blurry", taxAmount, dataRegion }` |
| Vision failure (catch) | 201 | `{ id, status: "processing", taxAmount: 0, dataRegion, processFailed: true }` |
| Pre-upload errors | 4xx/429 | unchanged (auth, rate limit, invalid file) |
| Blob put failure | 500 | unchanged; roll back or avoid orphan if feasible |

**Catch in upload route:** any error from `processReceiptTax` after successful Blob put. Log at `warn` with receiptId; do not rethrow.

### `POST /api/receipts/:id/process`

| Case | Response |
|------|----------|
| `status === "done"` | 200 idempotent (existing) |
| Vision success | 200 `{ id, status, taxAmount }` |
| Vision failure | 200 `{ id, status: "processing", processFailed: true }` — **not 503** |

Wrap `processReceiptTax` in try/catch; log failure; return processing.

### OpenAI SDK

Keep existing `maxRetries=2`, `timeout=120s`. Additional retries delegated to client `/process` calls.

---

## Client Design

### New API helper: `triggerReceiptProcess(id)`

```typescript
POST /api/receipts/:id/process
→ returns ApiReceipt fields or throws on non-2xx (auth/network only)
```

### `pollReceiptUntilSettled` enhancement

After `maxAttempts` with still `processing`:

1. Call `triggerReceiptProcess(id)` once
2. Poll up to `retryMaxAttempts` (default 20) more
3. Return last fetch result (may still be `processing`)

### `resumeProcessingReceipts(receipts)`

For each receipt where `status === "processing" && !pendingUpload`:

- Skip if already in `pollingRef`
- `void pollReceipt(id)` (which may trigger `/process` on timeout)

Called after:

- Initial hydrate + `flushPendingUploads` + `syncFromServer`
- `online` event handler (after flush)

### `flushPendingUploads`

Unchanged per-item logic; additionally:

- Called on **mount** when `navigator.onLine` (not only `online` event)
- **Interval retry:** every 60s while online and tab visible, retry pending uploads

### Upload response handling

When `POST /api/receipts` returns 201 with `status: "processing"` (with or without `processFailed`):

- Save receipt locally with server id
- Start `pollReceipt(id)` immediately

When upload throws (network/4xx before 201):

- Keep `pendingUpload: true` (existing)

### UI: stuck processing

| Condition | List subtitle | Detail sheet |
|-----------|---------------|--------------|
| Normal processing | `… · Processing` + Analyzing pulse | Spinner |
| Poll exhausted / `processFailed` | `… · Tap to retry` | **Retry analysis** button → `triggerReceiptProcess` + poll |

Optional prop `analysisStuck?: boolean` on list card driven by client-side Set of receipt ids that failed to settle after poll+process retry.

---

## Data Flow Diagrams

### Online snap (OpenAI fails)

```
Snap → upload 201 processing → poll → timeout → POST /process → poll → done|blurry|processing(stuck)
```

### Offline snap → online

```
Snap offline (pendingUpload) → online/mount flush → upload 201 → poll → …
```

### App reopen (online, pending queue)

```
mount → flushPendingUploads → syncFromServer → resumeProcessingReceipts
```

---

## Files

| File | Change |
|------|--------|
| `app/api/receipts/route.ts` | try/catch around `processReceiptTax`; 201 on Vision fail |
| `app/api/receipts/[id]/process/route.ts` | try/catch; 200 processing on Vision fail |
| `lib/client/receiptApi.ts` | `triggerReceiptProcess`; enhanced poll |
| `components/home/HomeScreen.tsx` | mount flush, interval pending retry, resume processing |
| `components/home/ReceiptListCard.tsx` | stuck processing copy (optional prop) |
| `components/receipts/ReceiptDetailSheet.tsx` | Retry analysis button on processing |
| `docs/tech/06-receipt-ai-pipeline.md` | Sync doc with implementation |

---

## Edge Cases

| Case | Behavior |
|------|----------|
| Duplicate flush of same pending | Sequential loop; id swap after success prevents re-upload |
| `/process` while poll running | `pollingRef` dedupes per id |
| User resnap on stuck processing | Existing resnap flow replaces receipt |
| Ghost rate limit on retry upload | pending stays queued; interval retries |
| EU/US region | Unchanged; `data_region` set at upload |

---

## Testing

1. Simulate OpenAI throw in upload route → 201 processing; client eventually settles or shows retry.
2. Offline snap → go online → receipt uploads and processes.
3. Kill app with pendingUpload → reopen online → flush runs on mount.
4. Server receipt stuck processing → refresh → resume poll + `/process`.
5. Tap Retry on processing sheet → triggers process + updates UI.
6. `npm run build` passes.

## Success Criteria

- No upload leaves client in ambiguous error state when Blob + DB row exist.
- Pending offline receipts upload without requiring offline→online toggle.
- Stuck `processing` receipts recover automatically once or via explicit user retry.
- Pipeline doc matches behavior.
