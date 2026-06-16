# Receipt List Merchant Display — Design

**Date:** 2026-06-16  
**Status:** Approved  
**Scope:** Main screen list shows UNKNOWN MERCHANT until detail open; persists after refresh/restart.

## Problem

Vision writes `merchantName` server-side, but client local state lacks `merchant` because:

1. `POST /api/receipts` returns slim `{ id, status, taxAmount }`; `apiReceiptFromUploadResponse` sets `merchant: null`.
2. Inline `done` skips processing watcher poll.
3. `unionMergeLWW` may prefer local (fabricated newer `updatedAt`) over remote with merchant.
4. `handleDetailReceiptUpdate` updates React only — not IndexedDB.

## Solution (Approach A)

### 1. Server

`POST /api/receipts` after successful `processReceiptTax`: `findUnique` + return full `serializeReceipt`. Failure path unchanged (slim `processing` body).

### 2. Client upload

- Detect full `ApiReceipt` in 201 body; else `apiReceiptFromUploadResponse`.
- If `done`/`blurry` and still no `merchant`, `fetchReceiptById` fallback.

### 3. LWW merge

When local wins on `updatedAt` but `status` is `done`/`blurry`, backfill missing `merchant`/`category`/`amount`/`currency`/`deductible` from remote.

### 4. Detail persist

`handleDetailReceiptUpdate` → `applyReceiptUpdate` (state + IndexedDB).

## Tests

| Case | Expected |
|------|----------|
| Upload 201 full body | `merchant` mapped |
| Local newer, no merchant; remote has merchant | LWW backfill |
| Detail fetch updates receipt | Persisted to IDB |

## Files

| File | Change |
|------|--------|
| `app/api/receipts/route.ts` | Full serialize on success |
| `lib/client/receiptApi.ts` | Full body detect + fetch fallback |
| `lib/client/receiptSync.ts` | Extraction backfill in LWW |
| `components/home/HomeScreen.tsx` | Detail → `applyReceiptUpdate` |
| `lib/client/receiptApi.test.ts` | Full upload mapping |
| `lib/client/receiptSync.test.ts` | LWW backfill test |
