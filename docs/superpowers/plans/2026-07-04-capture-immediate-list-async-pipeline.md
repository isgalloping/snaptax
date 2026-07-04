# Capture Immediate List + Async Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show every captured receipt in the home list immediately; decouple upload from local OCR; fix list pill states (analyzing vs uploading).

**Architecture:** Keep local-first save (`prepareReceiptCapture`) as source of truth. Batch shots call `setReceipts` per capture (like single). Remove `shouldBlockUploadForOcr` from all upload gates. Batch upload starts after Done (WorkerSession); single upload starts right after capture. Pill “uploading” only when receipt id is in React `uploadInFlightIds`.

**Tech Stack:** Next.js 16 · React 19 · IndexedDB/OPFS · Tesseract Worker · existing `POST /api/receipts` (no server changes).

**Spec:** [`docs/superpowers/specs/2026-07-04-capture-immediate-list-async-pipeline-design.md`](../specs/2026-07-04-capture-immediate-list-async-pipeline-design.md)

---

## File map

| File | Action |
|------|--------|
| `lib/receipts/receiptListVisualState.ts` | **Create** — pure pill/state resolver (testable) |
| `lib/receipts/receiptListVisualState.test.ts` | **Create** |
| `lib/client/batchCaptureFlush.ts` | **Modify** — remove OCR-blocked flush loop |
| `lib/client/batchCaptureFlush.test.ts` | **Modify** — add flush behavior test |
| `lib/client/scheduleOcrJob.ts` | **Modify** — document `shouldBlockUploadForOcr` deprecated for flush |
| `components/home/HomeScreen.tsx` | **Modify** — batch list insert, remove OCR wait, single upload trigger, in-flight state |
| `components/home/ReceiptListCard.tsx` | **Modify** — use shared resolver + `uploadInFlight` prop |
| `components/home/ReceiptList.tsx` | **Modify** — pass `uploadInFlightIds` |
| `components/home/OfflineHomeShell.tsx` | **Modify** — mirror batch `setReceipts` if batch enabled later (optional skip) |

---

## Task 1: List visual state resolver (TDD)

**Files:**
- Create: `lib/receipts/receiptListVisualState.ts`
- Create: `lib/receipts/receiptListVisualState.test.ts`
- Modify: `components/home/ReceiptListCard.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveReceiptListVisualState } from "./receiptListVisualState.ts";

describe("resolveReceiptListVisualState", () => {
  const processing = {
    status: "processing" as const,
    pendingUpload: true,
  };

  it("shows analyzing when pending but not uploading", () => {
    const r = resolveReceiptListVisualState(processing, {
      syncStuck: false,
      uploadInFlight: false,
    });
    assert.equal(r.pill, "analyzing");
    assert.equal(r.state, "analyzing");
  });

  it("shows uploading only when upload in flight", () => {
    const r = resolveReceiptListVisualState(processing, {
      syncStuck: false,
      uploadInFlight: true,
    });
    assert.equal(r.pill, "uploading");
    assert.equal(r.state, "uploading");
  });

  it("shows paused when sync stuck", () => {
    const r = resolveReceiptListVisualState(processing, {
      syncStuck: true,
      uploadInFlight: true,
    });
    assert.equal(r.pill, "paused");
  });

  it("shows analyzing when processing on server (no pending upload)", () => {
    const r = resolveReceiptListVisualState(
      { status: "processing", pendingUpload: false },
      { syncStuck: false, uploadInFlight: false },
    );
    assert.equal(r.pill, "analyzing");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm run test:unit -- lib/receipts/receiptListVisualState.test.ts`

Expected: module not found

- [ ] **Step 3: Implement resolver**

```typescript
import type { Receipt } from "@/lib/types";
import type { ReceiptVisualState } from "@/lib/ui/homeVisual";

export type ReceiptListVisualInput = Pick<Receipt, "status" | "pendingUpload">;

export function resolveReceiptListVisualState(
  receipt: ReceiptListVisualInput,
  opts: { syncStuck: boolean; uploadInFlight: boolean },
): { state: ReceiptVisualState; pill: "analyzing" | "uploading" | "paused" | "none" } {
  if (receipt.status !== "processing") {
    return { state: "done", pill: "none" };
  }
  if (opts.syncStuck) {
    return { state: "paused", pill: "paused" };
  }
  if (receipt.pendingUpload && opts.uploadInFlight) {
    return { state: "uploading", pill: "uploading" };
  }
  return { state: "analyzing", pill: "analyzing" };
}
```

- [ ] **Step 4: Wire `ReceiptListCard`**

Replace inline `resolveVisualState` with import; add prop `uploadInFlight?: boolean` (default `false`).

```typescript
import { resolveReceiptListVisualState } from "@/lib/receipts/receiptListVisualState";

// in props:
uploadInFlight?: boolean;

// in component:
const { state, pill } = resolveReceiptListVisualState(receipt, {
  syncStuck: syncStuck ?? false,
  uploadInFlight: uploadInFlight ?? false,
});
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `npm run test:unit -- lib/receipts/receiptListVisualState.test.ts`

- [ ] **Step 6: Commit**

```bash
git add lib/receipts/receiptListVisualState.ts lib/receipts/receiptListVisualState.test.ts components/home/ReceiptListCard.tsx
git commit -m "feat: distinguish analyzing vs uploading list pill states"
```

---

## Task 2: Remove OCR gate from upload paths

**Files:**
- Modify: `components/home/HomeScreen.tsx`
- Modify: `lib/client/scheduleOcrJob.ts` (comment only)

- [ ] **Step 1: Remove `shouldBlockUploadForOcr` checks in `uploadPendingInner`**

Delete early returns at lines using `shouldBlockUploadForOcr(receipt)` and `shouldBlockUploadForOcr(latest)`.

- [ ] **Step 2: Remove OCR filter in `flushPendingUploads`**

Change pending filter from:

```typescript
const pending = stored.filter(
  (r) =>
    r.pendingUpload &&
    !shouldSkipUploadAttempt(r) &&
    !shouldBlockUploadForOcr(r),
);
```

to:

```typescript
const pending = stored.filter(
  (r) => r.pendingUpload && !shouldSkipUploadAttempt(r),
);
```

- [ ] **Step 3: Remove unused import `shouldBlockUploadForOcr` from HomeScreen**

Add JSDoc on `shouldBlockUploadForOcr` in `scheduleOcrJob.ts`:

```typescript
/** @deprecated Do not gate upload flush; OCR runs in parallel with upload. */
export function shouldBlockUploadForOcr(
```

- [ ] **Step 4: Run full unit suite**

Run: `npm run test:unit`

Expected: all pass (`shouldBlockUploadForOcr` unit tests still valid for function behavior)

- [ ] **Step 5: Commit**

```bash
git add components/home/HomeScreen.tsx lib/client/scheduleOcrJob.ts
git commit -m "feat: stop blocking upload flush on local OCR completion"
```

---

## Task 3: Simplify batch flush loop (no OCR wait)

**Files:**
- Modify: `lib/client/batchCaptureFlush.ts`
- Modify: `lib/client/batchCaptureFlush.test.ts`

- [ ] **Step 1: Write failing integration-style test**

Add to `batchCaptureFlush.test.ts` (mock `loadAllReceipts` via injectable deps or test pure helpers):

Extract `sessionStillPendingUpload` tests — or add test that `flushSessionPendingUploads` does not import `waitForOcrJobs`. Minimal approach: test deleted helper `sessionBlockedOnOcr` is gone by asserting `batchCaptureFlush.ts` no longer imports `shouldBlockUploadForOcr`:

```typescript
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("batchCaptureFlush upload loop", () => {
  it("does not gate flush on OCR", () => {
    const src = readFileSync("lib/client/batchCaptureFlush.ts", "utf8");
    assert.equal(src.includes("shouldBlockUploadForOcr"), false);
    assert.equal(src.includes("waitForOcrJobs"), false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (imports still present)

- [ ] **Step 3: Simplify `flushSessionPendingUploads`**

Remove imports: `shouldBlockUploadForOcr`, `shouldSkipLocalOcr`, `waitForOcrJobs`.

Replace loop body with:

```typescript
while (Date.now() < deadline) {
  await flush();
  const stored = await loadAllReceipts();
  const pending = sessionStillPendingUpload(stored, ids);
  if (pending.length === 0) return;

  await new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, 150);
  });
}
```

Keep `computeBatchOcrWaitTimeoutMs` / `batchOcrWaitTimeoutMs` exports if used elsewhere; otherwise remove dead code in a follow-up (YAGNI: leave if HomeScreen still imports for nothing — remove unused imports from HomeScreen in Task 4).

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm run test:unit -- lib/client/batchCaptureFlush.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/client/batchCaptureFlush.ts lib/client/batchCaptureFlush.test.ts
git commit -m "feat: batch flush retries upload only, not OCR completion"
```

---

## Task 4: Batch immediate list + remove Done OCR wait

**Files:**
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1: `handleBatchShot` — immediate `setReceipts`**

After `const { receipt } = result;`:

```typescript
setReceipts((prev) => top100ByUpdatedAt([receipt, ...prev]));
scheduleOcrJob(receipt.id);
return receipt.id;
```

Ensure `top100ByUpdatedAt` is in scope (already used by `handleCapture`).

- [ ] **Step 2: Remove `waitForOcrJobs` from `handleBatchDone` and `handleBatchClose`**

Delete blocks:

```typescript
const ocrWaitMs = batchOcrWaitTimeoutMs(sessionIds.length);
if (ocrWaitMs > 0) {
  await waitForOcrJobs(sessionIds, ocrWaitMs);
}
```

Remove unused imports: `batchOcrWaitTimeoutMs`, `waitForOcrJobs` if no longer referenced.

- [ ] **Step 3: `handleBatchDone` list refresh**

Keep final `loadTopByUpdatedAt` + `setReceipts` for merge consistency after upload flush, but list is already populated from Task 4 Step 1 — this refresh syncs server/local fields post-upload.

- [ ] **Step 4: Manual smoke**

Run: `npm run dev` → batch 2 receipts → Done → cards visible immediately (not after 2min OCR wait).

- [ ] **Step 5: Commit**

```bash
git add components/home/HomeScreen.tsx
git commit -m "feat: show batch captures in list per shot; drop OCR wait on Done"
```

---

## Task 5: Single-shot immediate upload trigger

**Files:**
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1: After single capture list insert, trigger upload when online**

At end of `handleCapture` (after `scheduleOcrJob`):

```typescript
if (navigator.onLine) {
  void (async () => {
    try {
      await ensureGhostSession();
    } catch {
      return;
    }
    try {
      await uploadPendingInnerRef.current(processingReceipt);
    } catch {
      // budget updated in uploadPendingInner
    }
  })();
}
```

Use `processingReceipt` from destructuring; do not duplicate `uploadPendingInner` logic.

- [ ] **Step 2: Verify OCR handler remains safety net**

Confirm `setOcrCompleteHandler` still skips when `!pendingUpload` or `uploadInFlightRef.current.has(id)` — no change needed if already present.

- [ ] **Step 3: Commit**

```bash
git add components/home/HomeScreen.tsx
git commit -m "feat: start single-shot upload immediately after capture"
```

---

## Task 6: Wire `uploadInFlightIds` to list UI

**Files:**
- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/ReceiptList.tsx`

- [ ] **Step 1: Add React state synced with upload ref**

```typescript
const [uploadInFlightIds, setUploadInFlightIds] = useState<Set<string>>(
  () => new Set(),
);
```

In `uploadPendingInner`, when adding to `uploadInFlightRef`:

```typescript
uploadInFlightRef.current.add(latest.id);
setUploadInFlightIds(new Set(uploadInFlightRef.current));
```

In `finally`:

```typescript
uploadInFlightRef.current.delete(latest.id);
setUploadInFlightIds(new Set(uploadInFlightRef.current));
```

- [ ] **Step 2: Pass to `ReceiptList`**

```typescript
<ReceiptList
  ...
  uploadInFlightIds={uploadInFlightIds}
/>
```

- [ ] **Step 3: `ReceiptList` prop + card pass-through**

```typescript
uploadInFlightIds?: Set<string>;

// in map:
uploadInFlight={uploadInFlightIds?.has(receipt.id) ?? false}
```

- [ ] **Step 4: Visual check**

Capture single receipt online → pill shows **analyzing** briefly, then **uploading** when POST starts, then **analyzing** again during server AI (`pendingUpload: false`).

- [ ] **Step 5: Commit**

```bash
git add components/home/HomeScreen.tsx components/home/ReceiptList.tsx
git commit -m "feat: drive uploading pill from upload in-flight set"
```

---

## Task 7: Full verification

**Files:** none (QA)

- [ ] **Step 1: Unit tests**

Run: `npm run test:unit`

Expected: all pass

- [ ] **Step 2: Lint**

Run: `npm run lint`

Note: pre-existing lint debt acceptable; no new errors in touched files.

- [ ] **Step 3: Manual QA (from spec)**

| Case | Pass |
|------|------|
| Single snap → card in list on camera close | ☐ |
| Single → upload starts without waiting OCR | ☐ |
| Batch 4 → Done → 4 cards immediate | ☐ |
| No `waitForOcrJobs` delay before flush | ☐ |
| Pill analyzing before HTTP upload | ☐ |
| Pill uploading during POST | ☐ |
| 4× POST 201, no blob/ghost storm | ☐ |

- [ ] **Step 4: Final commit (if doc touch)**

Optional: add footnote to `2026-06-08-batch-snap-camera-design.md` §Architecture pointing to new spec.

```bash
git add docs/superpowers/specs/2026-06-08-batch-snap-camera-design.md
git commit -m "docs: note batch list/upload timing superseded by 2026-07-04 spec"
```

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Immediate list (batch per-shot) | Task 4 |
| Immediate list (single — already had setReceipts) | unchanged |
| Upload not gated on OCR | Task 2 |
| WorkerSession: batch upload after Done | unchanged (SnapButton) |
| Remove Done OCR wait | Task 4 |
| Remove flush OCR loop | Task 3 |
| Single immediate upload | Task 5 |
| Pill analyzing vs uploading | Task 1, 6 |
| OCR handler safety net | Task 5 Step 2 verify |
| No server AI retry on late ocrDraft | no code change |
| Tests | Tasks 1, 3 |

No placeholders remain.

---

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-07-04-capture-immediate-list-async-pipeline.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — implement all tasks in this session with checkpoints  

Which approach do you want?
