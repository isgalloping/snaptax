# Receipt List Merchant Display — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or executing-plans.

**Goal:** Main list shows merchant/category immediately after processing; dirty IndexedDB self-heals on sync; detail updates persist.

**Architecture:** Server returns full receipt on upload success; client maps/hydrates; LWW backfills extraction fields; detail uses `applyReceiptUpdate`.

**Tech Stack:** Next.js API, Prisma, IndexedDB, node:test

---

### Task 1: Server full upload response

- [ ] `POST /api/receipts` success → `serializeReceipt(findUnique)`

### Task 2: Client upload mapping + fallback

- [ ] `isFullApiReceipt` + extended `apiReceiptFromUploadResponse`
- [ ] `uploadReceipt` fetchById fallback when merchant missing

### Task 3: LWW extraction backfill

- [ ] `backfillExtractionFromRemote` in `unionMergeLWW`
- [ ] Unit test: local newer, remote has merchant

### Task 4: Detail persist

- [ ] `handleDetailReceiptUpdate` → `applyReceiptUpdate`

### Task 5: Verify

- [ ] `npm run test:unit`
- [ ] `npm run build`
