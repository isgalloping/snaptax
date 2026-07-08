# Capture Immediate List + Async OCR/Upload Pipeline — Design

**Date:** 2026-07-04  
**Status:** Approved (design)  
**Scope:** Client capture → list → OCR → upload → server AI ordering. Single-shot and batch paths. List pill UX.

**References:** [`2026-06-08-batch-snap-camera-design.md`](./2026-06-08-batch-snap-camera-design.md) · [`2026-06-19-ocr-pipeline-redesign-design.md`](./2026-06-19-ocr-pipeline-redesign-design.md) · [`receipt-sync-lifecycle-design.md`](../topics/receipt-sync-lifecycle-design.md) · [`docs/tech/11-ocr-pipeline-design.md`](../../tech/11-ocr-pipeline-design.md)

**Amends:** Batch spec §Architecture (`handleBatchDone` list merge timing, OCR-before-upload gate). Aligns client with OCR design doc: *upload scheduling independent of OCR completion; does not block shutter.*

---

## Problem

Users perceive receipts as appearing in the home list only after upload (especially batch: list refreshes on Done **after** OCR wait + flush). The pipeline blocks upload on local OCR (`shouldBlockUploadForOcr`), delaying server AI and keeping cards in a misleading **uploading** state before any network request.

**Goal:** After every capture, the receipt **immediately** appears in the home list. Local OCR and server AI run **asynchronously** without gating list visibility or upload start (subject to WorkerSession).

---

## Locked decisions (grilling 2026-07-04)

| # | Topic | Choice |
|---|--------|--------|
| 1 | Scope | Single + batch; upload **does not wait** for OCR; list visible **immediately** after capture |
| 2 | WorkerSession | **Zero upload** while batch camera is open; upload starts after Done/Back |
| 3 | OCR/upload race | First upload’s AI result wins; late `ocrDraft` **does not** re-trigger OpenAI |
| 4 | Batch Done timing | Wait only for photo/IDB write (`waitForBatchSavesIdle`); **remove** `waitForOcrJobs` before flush |
| 5 | Batch list state | Each `handleBatchShot` → `setReceipts` (same as single `handleCapture`) |
| 6 | List pill | Before upload HTTP: **analyzing**; during upload HTTP: **uploading** |
| 7 | Single-shot upload | Start async upload immediately after local save + list insert |
| 8 | `flushSessionPendingUploads` | **Remove** OCR-blocked wait branch |
| 9 | OCR complete handler | Keep as upload **safety net**: `pendingUpload && !uploadInFlight` |
| 10 | Pill implementation | React `uploadInFlightIds: Set<string>` |

---

## Out of scope

- Resnap flow semantics (unchanged single-shot replace path)
- Server-side second-pass AI when `ocrDraft` arrives after Vision upload
- Est. Tax Saved formula (still `SUM(taxAmount)` for `done` only)
- Offline: list + local OCR only; upload when online (unchanged)
- WorkerSession rewrite (camera-open merge defer, watcher pause — unchanged)

---

## Target pipeline

```text
Shutter
  → compress + OPFS + IDB receipt (processing, pendingUpload, merchant "Scanning")
  → setReceipts (immediate list card — analyzing pill)
  → scheduleOcrJob (background Worker, non-blocking)

Single-shot:
  → camera closes
  → ensureGhostSession + uploadPendingInner (parallel with OCR)
  → server AI (Path A if ocrDraft on wire, else Vision)
  → watcher / ProcessingQueue → done

Batch:
  → camera stays open (WorkerSession: no upload)
  → each shot: setReceipts + scheduleOcrJob
  → Done/Back: waitForBatchSavesIdle only
  → flushSessionPendingUploads (no OCR wait)
  → server AI per receipt (same Path A / Vision rules)
```

### OCR vs upload race (accepted)

| Order | Server path |
|-------|-------------|
| OCR finishes before upload POST | Path A (`ocrDraft` in multipart) when quality gate passes |
| Upload POST before `ocrDraft` persisted | Vision fallback (Path B) — **no retry** when OCR completes later |

---

## List card visual states

`ReceiptListCard.resolveVisualState` rules (processing only):

| Condition | Pill | Circular icon state |
|-----------|------|---------------------|
| `syncStuck` | paused | paused |
| `pendingUpload` && `id ∈ uploadInFlightIds` | uploading | uploading |
| `pendingUpload` && not in flight | analyzing | analyzing |
| `!pendingUpload` && processing | analyzing | analyzing (server AI) |
| `done` / `blurry` | none | done |

**Note:** During batch camera session, cards are in React state but hidden behind overlay; when Done closes camera, user sees analyzing pills immediately — not uploading.

---

## Component changes

### `HomeScreen.tsx`

| Change | Detail |
|--------|--------|
| `handleBatchShot` | After `prepareReceiptCapture`, `setReceipts(top100([receipt, ...prev]))` — mirror `handleCapture` |
| `handleCapture` | After `setReceipts` + `scheduleOcrJob`, if online: `void uploadPendingInner(receipt)` (or enqueue single-id flush) |
| `handleBatchDone` / `handleBatchClose` | Remove `waitForOcrJobs`; keep `waitForBatchSavesIdle` in SnapButton before callback; flush without OCR gate |
| `flushPendingUploads` | Stop filtering with `shouldBlockUploadForOcr` |
| `uploadInFlightIds` | State or ref exposed to `ReceiptList`; sync with existing `uploadInFlightRef` |
| OCR handler | Unchanged trigger conditions except remove OCR upload gate; skip if `batchFlushActiveRef` or `isBatchOcrUploadDeferred` during session |

### `SnapButton.tsx`

No change to WorkerSession: `endBatchCaptureDefer` after `onBatchDone` / `onBatchClose` (upload deferred until camera closes).

### `lib/client/scheduleOcrJob.ts`

- `shouldBlockUploadForOcr`: **deprecated for flush gating** — may remain exported for tests until removed; flush paths must not call it.
- OCR Worker behavior unchanged.

### `lib/client/batchCaptureFlush.ts`

- Remove `sessionBlockedOnOcr` / `waitForOcrJobs` branch inside `flushSessionPendingUploads`.
- Keep retry loop for pending upload budget / network (150ms poll + max deadline).

### `components/home/ReceiptList.tsx` / `ReceiptListCard.tsx`

- Pass `uploadInFlightIds` (or `isUploadInFlight(id)`) into cards.
- Update `resolveVisualState` per table above.

---

## WorkerSession compliance

| Phase | Network |
|-------|---------|
| Batch camera open | No auto upload (existing defer + `batchFlushActiveRef`) |
| Done/Back | Upload flush allowed |
| Single after capture | Camera closed → upload allowed immediately |
| Watcher poll | Still paused when `cameraOpen` (unchanged) |

---

## Error handling

| Case | Behavior |
|------|----------|
| `loadPhoto` null at upload | Existing `applyPhotoMissingState` + sync stuck (unchanged) |
| Upload fails (budget) | `recordWriteFailure`; pill → paused when stuck |
| Duplicate 409 | Existing `handleDuplicateUpload` (unchanged) |
| OCR fails / skip | Upload proceeds without `ocrDraft` → Vision |
| OCR completes after upload | `ocrDraft` saved locally only; **no** `/process` retry for Path A |

---

## Tests

| Case | Expected |
|------|----------|
| `shouldBlockUploadForOcr` no longer blocks flush | Pending receipt uploads while `isOcrJobPending` |
| Batch shot | `setReceipts` called per shot; count increases before Done |
| Batch Done | No `waitForOcrJobs` call before flush |
| `flushSessionPendingUploads` | No OCR-blocked wait branch |
| Pill: pending, not in flight | analyzing |
| Pill: id in `uploadInFlightIds` | uploading |
| OCR handler | Skips when `!pendingUpload` or id in upload in-flight |

---

## Files (expected touch list)

| File | Change |
|------|--------|
| `components/home/HomeScreen.tsx` | Batch list insert; single upload trigger; remove OCR flush gate |
| `components/home/ReceiptListCard.tsx` | Pill rules + prop |
| `components/home/ReceiptList.tsx` | Pass upload in-flight set |
| `lib/client/batchCaptureFlush.ts` | Remove OCR wait loop |
| `lib/client/batchCaptureFlush.test.ts` | Update/remove OCR-blocked tests |
| `lib/client/scheduleOcrJob.test.ts` | Adjust if `shouldBlockUploadForOcr` usage changes |
| `docs/superpowers/specs/2026-06-08-batch-snap-camera-design.md` | Optional footnote: superseded list/upload timing sections |

---

## Success criteria (manual QA)

1. **Single:** Tap snap → card appears in list within one frame of camera close; analyzing pill; upload starts without waiting for OCR spinner.
2. **Batch 4 shots:** Done → 4 cards visible immediately; analyzing → uploading per card as uploads run; 4× `POST /api/receipts` 201 (no ghost/blob storm).
3. **Slow OCR:** Upload may precede `ocrDraft`; receipt still reaches `done` via Vision if needed.
4. **Offline batch:** Cards in list; no upload until online; flush on reconnect.

---

## Spec self-review

- [x] No TBD sections
- [x] Consistent with grilling decisions 1–10
- [x] WorkerSession + OCR design doc alignment stated
- [x] Scope bounded; server unchanged except existing upload idempotency (`allowOverwrite`)
- [x] Pill rules unambiguous (in-flight Set, not derived-only)
