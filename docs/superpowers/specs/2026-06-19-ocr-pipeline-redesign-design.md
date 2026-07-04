# OCR Pipeline Redesign — Design

**Date:** 2026-06-19  
**Status:** Approved (design) — 中文详设 [`docs/tech/11-ocr-pipeline-design.md`](../../tech/11-ocr-pipeline-design.md)  
**Source:** [`docs/ocr/ocr-desn.md`](../../ocr/ocr-desn.md)  
**Scope (Phase 1 — this implementation):** Local OCR Worker → `parseReceipt` → server router (`classifyReceiptText` | `processReceiptVision` fallback) → `computeTaxAmount` → existing IDB merge / upload. **UI unchanged.**

**Deferred to Phase 2 (data consistency):** Event Queue, Background Sync batch, `POST /api/sync/events`, Postgres Event Store, WorkerSession — see [receipt-lifecycle-sync-redesign](./2026-06-19-receipt-lifecycle-sync-redesign-design.md) and [`docs/tech/11-ocr-pipeline-design.md`](../../tech/11-ocr-pipeline-design.md) §16.

**Related (Phase 1):** [`06-receipt-ai-pipeline.md`](../../tech/06-receipt-ai-pipeline.md)

---

## Summary

`ocr-desn.md` describes the **correct long-term architecture** for Snap1099 blue-collar users: capture never blocks; **local OCR** handles ~90% of extraction; **OpenAI reads text** for IRS/Schedule C classification (not images); **Vision** is a **1–5% fallback**. The shipped codebase still runs **one server-side Vision call** that merges OCR + classification (`lib/openai/receiptVision.ts`), which is costly, cannot run offline, and contradicts the design doc’s cost model.

This spec locks **Phase 1 OCR pipeline** per approved flow. Full `ocr-desn.md` diagram remains product end-state; **Event Queue → Event Store is Phase 2**, not in scope now.

**Recommendation:** Approach B for OCR only — client Worker OCR + server text classify; OCR failure → **`processReceiptVision`** (production). **Keep existing row upsert / LWW / `flushPendingUploads`** until Phase 2.

### Fallback rule (product correction)

> **若本地 OCR 识别失败，采用 OpenAI 处理 — 与当前线上模式完全一致。**

| Situation | Server path |
|-----------|-------------|
| Local OCR **passes** quality gate | **New:** `classifyReceiptText` (text-only, gpt-mini) |
| Local OCR **fails** (engine error, skipped, low confidence, missing merchant/total, garble) | **Current:** `processReceiptVision` — **no behavior change** |
| Text classify **fails** (parse / Zod / empty) | **Current:** `processReceiptVision` on same upload/retry |
| Client sends **image only** (no ocrDraft, legacy) | **Current:** `processReceiptVision` (100% today) |

Vision fallback is **not** a new API or prompt variant — it is the existing monolithic image pipeline reused as-is.

---

## §0 Canonical flow — Phase 1 vs Phase 2

**Phase 1 (implement now):**

```text
Capture → IDB Save → Local OCR → (Vision fallback) → Structured Receipt
  → GPT Tax Classify → computeTaxAmount → IDB merge (existing sync)
```

**Phase 2 (deferred — data consistency):**

```text
… → Event Queue → Background Sync → POST /api/sync/events → Event Store
```

Authoritative **Chinese detailed design:** [`docs/tech/11-ocr-pipeline-design.md`](../../tech/11-ocr-pipeline-design.md).

### §0.1 Phase 1 step mapping

| Step | Runtime | Phase |
|------|---------|-------|
| Capture → IDB Save → Local OCR → parseReceipt | Client | **1** |
| Upload + classifyReceiptText / Vision fallback + computeTaxAmount | Server | **1** |
| IDB merge (`apiReceiptToLocal`) | Client | **1** (existing sync) |
| Event Queue → Background Sync → Event Store | Client + Server | **2 deferred** |

### §0.2 Two extraction paths

```text
Path A (≈90%):  local OCR → parseReceipt → upload ocrDraft → classifyReceiptText → computeTaxAmount
Path B (≈1–5%): local OCR fail → upload image → processReceiptVision → computeTaxAmount
                  (Vision returns structured fields + classification in one call — current behavior)
```

Phase 1 uses **existing** upload / merge; no lifecycle event table yet.

### §0.3 Event types — **Phase 2 only (deferred)**

Append-only; **never overwrite** events. Row snapshot in `receipts` table remains UI source; events are audit + sync transport.

| Event | Emitted when | Payload (minimal) |
|-------|--------------|-------------------|
| `RECEIPT_CREATED` | After initial IDB save | `{ receiptId, timestamp, pendingUpload }` |
| `OCR_COMPLETED` | Local OCR success **or** Vision fallback extraction done | `{ source: "local_ocr" \| "vision_fallback", confidence?, engine? }` |
| `TAX_CALCULATED` | After server deduction + client IDB merge | `{ status, taxAmount, category, extractionSource }` |
| `SYNC_PENDING` | Event batch not yet acked | `{ cursor }` — internal marker |

Optional later: `SYNC_ACKED` server-side only.

Background sync (from `ocr-desn.md` §11):

```typescript
canBackgroundSync =
  navigator.onLine &&
  !workerSessionActive;   // same as isCapturing === false
```

Batch: **50 events** per `POST /api/sync/events` (aligns with sync redesign window).

### §0.4 UI mapping (unchanged)

User-visible status remains **`processing`** until `TAX_CALCULATED` + IDB merge → **`done`** or **`blurry`**. Internal events do not surface new labels.

---

## §1 Source doc analysis (`ocr-desn.md`)

### 1.1 What the product doc gets right

| Theme | Intent | Why it matters |
|-------|--------|----------------|
| Offline-first capture | IDB save <100ms; user keeps shooting | Matches PRODUCT-SPEC §2.2 |
| Two-stage AI | OCR ≠ tax brain | Cheaper, auditable, testable |
| Vision as fallback | Trigger only on low OCR quality | Target 1–5% Vision rate |
| Deterministic tax math | `deductible × ratio × rate` after classification | Already `computeTaxAmount` server-side |
| WorkerSession sync | Phase 2 | Deferred with event sync |
| Performance budget | 0.8–1.5s end-to-end when online | Blue-collar “instant savings” feel |
| Cost budget | ~90% local + mini; <$0.01/receipt avg | Opposite of 100% Vision |

### 1.2 What differs from shipped MVP

| `ocr-desn.md` | Current code |
|---------------|----------------|
| Statuses: RAW → OCR_PROCESSING → … → SYNCED | `processing` \| `done` \| `blurry` only |
| Local ONNX / Tesseract WASM in **client Worker** | **None** — no client OCR |
| OpenAI **text-only** tax classify | Single Vision prompt returns amount + category + confidence |
| `parseReceipt()` structured extract | Embedded in Vision JSON |
| Event sourcing + Event Store | Row upsert only | **Phase 2** — append-only queue + Postgres |
| Preprocess: 1280px, q0.7, ROI crop | Server `prepareVisionImage`: max edge 1568, q82, no ROI |
| Client preprocess in Worker | Server-only `sharp` on upload |

### 1.3 UI-only exclusions

| Item | Reason |
|------|--------|
| New user-visible statuses (RAW, OCR_DONE, SYNCED chips) | User constraint: **UI unchanged** |
| Changing list card / TaxHeader / Snap UX | Out of scope |

Event Queue / Event Store — **Phase 2**; no new UI in either phase.

---

## §2 Current pipeline (as-built)

```
Client capture → IDB (processing, pendingUpload?)
       ↓ online
POST /api/receipts (image bytes)
       ↓
Vercel Blob put
       ↓
processReceiptTax → processReceiptVision (image + US/EU prompt)
       ↓
Zod + visionConfidenceTier → done | blurry
       ↓
computeTaxAmount → Postgres update
```

**Pain points:**

1. **100% Vision** on every online receipt — cost and latency scale with image tokens.
2. **No offline extraction** — offline rows sit `processing` with zero structured progress until upload.
3. **Monolithic prompt** — hard to unit-test merchant/total parsing separately from Schedule C logic.
4. **Single failure domain** — Vision timeout/parse fail → `blurry` or stuck `processing`; no cheaper retry path.
5. **Preprocess mismatch** — doc targets smaller/faster images for OCR; server sends larger JPEG to Vision.

---

## §3 Design approaches

### Approach A — Server-only split (no client OCR)

Server after Blob put: `sharp` preprocess → Tesseract/Paddle (Node) → text classify → Vision fallback.

| Pros | Cons |
|------|------|
| No WASM bundle; one deploy surface | **Fails offline OCR goal** — no text until upload |
| Easier serverless testing | Cold-start + native OCR deps on Vercel |
| Smaller client diff | Does not match `ocr-desn.md` Worker model |

**Verdict:** Reject as primary — contradicts offline-first and doc §3.

---

### Approach B — Split pipeline hybrid (**recommended**)

```
Client Worker: preprocess → local OCR → parseReceipt → persist ocrDraft in IDB
       ↓ online + WorkerSession idle (sync gate)
POST /api/receipts { image, ocrDraft? }
       ↓
Server: if ocrDraft passes quality gate → processReceiptTaxFromText
        else → processReceiptVision (fallback)
       ↓
computeTaxAmount (unchanged) → done | blurry
```

| Pros | Cons |
|------|------|
| Matches doc cost/latency targets | New Worker + model assets (~2–4MB WASM) |
| Offline OCR progress without OpenAI | ONNX integration effort |
| Vision rate drops to 1–5% | Two server code paths to maintain |
| UI unchanged — still `processing` until classify completes | Upload payload grows slightly |

**Verdict:** **Recommended.**

---

### Approach C — Prompt-only optimization (minimal)

Keep 100% Vision; tune `prepareVisionImage` (1280/q0.7), split prompts internally, add `detail: "auto"`.

| Pros | Cons |
|------|------|
| ~1 week effort | Does **not** achieve 90% non-Vision target |
| Zero client OCR | Cost reduction marginal |

**Verdict:** Optional **Phase 0** quick win only; not sufficient as end state.

---

## §4 Target architecture — Phase 1

```text
Client: capture → IDB → OcrWorker → ocrDraft
         ↓ (existing flushPendingUploads)
Server: POST /api/receipts → processReceiptTax router
         → classifyReceiptText | processReceiptVision → computeTaxAmount
Client: merge (existing apiReceiptToLocal)

--- Phase 2 (deferred): event queue + POST /api/sync/events + Event Store ---
```

### 4.1 UI contract (frozen)

| User sees today | After redesign |
|-----------------|----------------|
| `Processing...` / Uploading | Same — covers local OCR + server classify in flight |
| `done` + tax saved | Same |
| `blurry` + resnap | Same |
| REVIEW / ACTION buckets | Same rules (`visionConfidenceTier`, `photoMissing`) |

No new strings, sheets, or status chips.

### 4.2 Phase 1 observability (optional `ai_raw`)

Server/client may set `extractionSource`, `ocrEngine` on `ai_raw` for metrics. **No** `snaptax_receipt_events` IDB store in Phase 1.

Lifecycle event types (`ReceiptLifecycleEvent`) — **Phase 2 only**; see [`11-ocr-pipeline-design.md`](../../tech/11-ocr-pipeline-design.md) §16.

---

## §5 Local OCR layer (client Worker)

### 5.1 Preprocess (align `ocr-desn.md`)

| Parameter | Doc | Target |
|-----------|-----|--------|
| Max edge | 1280px | **1280** (`OCR_MAX_EDGE`) |
| JPEG quality | 0.7 | **0.70** (`OCR_JPEG_QUALITY`) |
| ROI crop | receipt center bias | **Phase 1:** full frame; **Phase 1.1:** optional center 85% crop if aspect > 2:1 |
| Thread | Web Worker | **`lib/workers/ocrWorker.ts`** — never block main thread |

Reuse capture-time orientation; do not re-open camera.

### 5.2 Engine selection

| Priority | Engine | When |
|----------|--------|------|
| 1 | **ONNX Runtime Web** + receipt OCR model | Default when WASM loads & `crossOriginIsolated` / COOP ok |
| 2 | **Tesseract.js** (`eng` traineddata) | Fallback if ONNX fails init |
| 3 | Skip local OCR | Low-memory guard (`navigator.deviceMemory <= 2`), worker queue > 3 pending |

Model hosting: static assets under `/public/ocr/` or Serwist precache; lazy load **after** first paint (do not block startup — constraint C4 from sync spec).

### 5.3 `runLocalOcr` output

```typescript
type LocalOcrResult = {
  text: string;
  confidence: number; // 0–1
  engine: "onnx" | "tesseract" | "skipped";
  durationMs: number;
};
```

### 5.4 `parseReceipt()` (new `lib/ocr/parseReceipt.ts`)

Pure function, unit-tested — extracts from OCR text:

```typescript
type ParsedReceiptDraft = {
  merchant?: string;
  date?: string;       // ISO date candidate
  total?: number;
  tax?: number;
  rawText: string;
  signals: {
    merchantMissing: boolean;
    totalMissing: boolean;
    garbleRatio: number; // non-alnum / length
  };
};
```

Heuristics (US-first, EU Phase 1.1):

- **Total:** last matching `TOTAL|AMOUNT DUE|BALANCE` line; prefer `$xx.xx` / `€xx.xx`
- **Merchant:** first non-empty line excluding date/phone; strip store `#` suffix optional
- **Date:** `\d{1,2}/\d{1,2}/\d{2,4}` near top
- **Garble ratio:** `(nonPrintable + replacementChar) / len`

### 5.5 Quality gate — pass vs OpenAI fallback

**Pass → text classify.** Enter **OpenAI Vision (current mode)** when **any**:

```text
local OCR engine failed or was skipped (no usable ocrDraft)
OR ocr.confidence < 0.6
OR parsed.merchantMissing
OR parsed.totalMissing
OR parsed.signals.garbleRatio > 0.5
```

On gate failure the server **does not** attempt text classify — it invokes **`processReceiptVision` exactly as today** (same `US_RECEIPT_PROMPT` / `EU_RECEIPT_PROMPT`, `prepareVisionImage`, `visionConfidenceTier`, `blurryFallback`, `/process` retry semantics).

Expected Vision share: **1–5%** on clear receipt photos (monitor via `aiRaw.extractionSource`).

---

## §6 Structured Receipt + server tax classification

Both paths converge on **`StructuredReceipt`** before GPT tax classify and deduction:

```typescript
type StructuredReceipt = {
  merchant: string;
  date?: string;
  total: number;
  tax?: number;
  rawText: string;
  extractionSource: "local_ocr" | "vision_fallback";
};
```

- **Path A:** built client-side from `parseReceipt(localOcr.text)`
- **Path B:** built server-side from `processReceiptVision` result (current)

### 6.1 GPT tax classification (text-only on Path A)

OpenAI **does not receive images** on Path A.

Location: `lib/openai/classifyReceiptText.ts` — input is `StructuredReceipt` + `data_region` + `industry`.

Model: **`gpt-4o-mini`** (or `OPENAI_CLASSIFY_MODEL`). Output: `UsReceiptAiSchema` / `EuReceiptAiSchema`.

### 6.2 Vision fallback (Path B)

**Path B** uses **`processReceiptVision`** unchanged — extraction + classification in one Vision call (current production). Still runs **`computeTaxAmount`** after.

### 6.3 Extended entry: `processReceiptTax`

```typescript
processReceiptTax({
  receiptId,
  dataRegion,
  imageBuffer?,      // required for vision fallback
  mime?,
  ocrDraft?,          // from client upload JSON
  industry?,
  canMockAi?,
})
```

Decision tree:

```text
if imageBuffer missing → OCR_INPUT_MISSING

if ocrDraft present && passesQualityGate(ocrDraft):
    try classifyReceiptText()
    if success → return (same Zod + computeTaxAmount as Vision)
    else → fall through   // classify failure → Vision

// Local OCR failed OR no ocrDraft OR classify failed:
→ processReceiptVision()   // IDENTICAL to current production
```

Log `aiRaw.extractionSource: "local_ocr" | "vision_fallback"` (`vision_fallback` = same code path as pre-redesign uploads).

**Non-goal:** Do not fork Vision into a “lite” or “fallback-specific” prompt — one implementation, two entry triggers.

### 6.4 Deduction calculation + client IDB save

After classify (Path A) or Vision (Path B):

1. Server: **`computeTaxAmount`** → persist Postgres row
2. Client: merge API response → **`saveReceipt`** (`done` | `blurry`, `taxAmount`, `aiRaw`)
3. Client: append **`TAX_CALCULATED`** to event queue

**Canonical rule:** persisted `tax_amount` / client `taxAmount` always originate from server `computeTaxAmount` — never client-side tax math (preview hints out of scope).

---

## §7 Upload API contract (backward compatible)

### 7.1 `POST /api/receipts`

Extend multipart/JSON body (optional fields):

```typescript
{
  clientReceiptId: string;
  // existing image bytes
  ocrDraft?: {
    text: string;
    confidence: number;
    parsed: ParsedReceiptDraft;
    engine: string;
    preprocessVersion: 1;
  };
}
```

Server behavior:

| Client sends | Server path |
|--------------|-------------|
| Image only (legacy / OCR skipped) | **`processReceiptVision`** — same as today |
| Image + ocrDraft passing gate | `classifyReceiptText`; on failure → **`processReceiptVision`** |
| Image + ocrDraft failing gate | **`processReceiptVision`** — skip text classify |

Response shape **unchanged** (`serializeReceipt` / `processing` + `processFailed`). Vision success/failure HTTP codes identical to [pipeline resilience spec](./2026-06-07-receipt-pipeline-resilience-design.md).

### 7.2 `POST /api/receipts/:id/process`

Idempotent retry — **unchanged contract**:

- If already `done`/`blurry` → return idempotently (today)
- Else if stored `ocrDraft` passes gate → try text classify; on fail → **`processReceiptVision`**
- Else → **`processReceiptVision`** (same as current `/process`)

Optional: persist `ocrDraft` in `ai_raw` for retry without re-running client OCR.

---

## §8 Execution scheduling (Phase 1)

Use **existing** upload triggers (`flushPendingUploads`, watcher, `online`). OCR jobs: enqueue only, max 1 concurrent Worker.

| Phase | OCR behavior |
|-------|----------------|
| Snapping / batch | Enqueue OCR; never await on capture path |
| Offline | Local OCR → `ocrDraft` in IDB |
| Online | Existing flush uploads `ocrDraft` when present |

**Hard rule:** `handleCapture` / `handleBatchShot` → `savePhoto` + `saveReceipt` + `scheduleOcrJob(id)` only (<100ms).

WorkerSession gating — **Phase 2** with sync redesign.

---

## §9 Preprocess — client OCR vs server Vision

| Path | Preprocess | Notes |
|------|------------|-------|
| **Client local OCR** | 1280px, q0.7 (`OCR_*` env) | Worker only; aligns with `ocr-desn.md` |
| **OpenAI Vision fallback** | **Unchanged** — `prepareVisionImage` as today (`RECEIPT_VISION_MAX_EDGE=1568`, q82) | Product correction: fallback = current production behavior |

Do **not** retune Vision preprocess as part of OCR redesign unless separately approved (would change fallback outcomes vs today).

---

## §10 Confidence & status mapping (unchanged externally)

Continue [home-v2 three-tier](../../superpowers/specs/2026-06-17-home-v2-first-screen-design.md):

| Tier | Condition | `status` | Bucket |
|------|-----------|----------|--------|
| action | confidence < 0.5 OR amount ≤ 0 | `blurry` | ACTION |
| review | 0.5 ≤ confidence < 0.7 | `done` | REVIEW |
| ready | ≥ 0.7 | `done` | READY |

Apply tier to **classification confidence** from text or Vision (same helper `visionConfidenceTier`).

---

## §11 Cost & observability targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Vision fallback rate | 1–5% | `extractionSource=vision_fallback` / uploads |
| Text classify rate | ~90% | `extractionSource=local_ocr` |
| P50 time to `done` (online, clear photo) | 0.8–1.5s | `aiRaw.pipeline` stage timestamps |
| Avg OpenAI cost / receipt | < $0.01 | token logs `biz.openai` |
| Offline OCR success | >80% parseable total | local QA suite |

Log events (extend `biz.openai`):

```text
module=biz.ocr stage=local_ocr|text_classify|vision_fallback receiptId=… durationMs=… engine=…
```

---

## §12 Module map (implementation phase — deferred)

| New / modified | Role |
|----------------|------|
| `lib/workers/ocrWorker.ts` | WASM OCR + preprocess |
| `lib/ocr/parseReceipt.ts` | Heuristic struct extract |
| `lib/ocr/qualityGate.ts` | Fallback decision |
| `lib/ocr/scheduleOcrJob.ts` | OCR job FIFO queue |
| `lib/openai/classifyReceiptText.ts` | Text-only LLM |
| `lib/openai/prompts/usClassify.ts`, `euClassify.ts` | Split from Vision prompts |
| `lib/receipts/processReceiptTax.ts` | Router: text vs vision |
| `lib/receipts/prepareVisionImage.ts` | **No change** for Vision fallback (current behavior) |
| `lib/storage/receiptDb.ts` | `ocrDraft` on `StoredReceipt` (**Phase 1**) |
| `app/api/receipts/route.ts` | Accept ocrDraft |
| Tests | parseReceipt, qualityGate, processReceiptTax router |

**Phase 2 (deferred):** `receiptEventQueue`, `flushEventBatch`, `/api/sync/events`, Prisma event tables.

**Do not modify:** UI list/bucket components.

---

## §13 Phased rollout

### Phase 1 (OCR — implement now)

| Step | Deliverable | Vision % |
|------|-------------|----------|
| O0 | `extractionSource` in `ai_raw` + logs | ~100% |
| O1 | Server router + `classifyReceiptText`; client image-only | ~100% |
| O2 | Worker OCR + `ocrDraft` upload | 1–5% |
| O3 | ROI / EU parse polish | 1–5% |

Existing **upload / merge / LWW** unchanged.

### Phase 2 (data consistency — deferred)

Event Queue IDB, `POST /api/sync/events`, Postgres Event Store, WorkerSession — with [sync redesign](./2026-06-19-receipt-lifecycle-sync-redesign-design.md).

---

## §14 Acceptance criteria

1. **UI:** Pixel-identical status presentation; no new Modals or filter tabs.
2. **Capture:** 10 rapid batch shots — IDB <100ms; OCR does not block shutter.
3. **Offline:** 5 snaps offline → local `ocrDraft` populated; all remain `processing`; no OpenAI calls.
4. **Online:** Clear gas station receipt → text classify → `done` without Vision (`extractionSource=local_ocr`).
5. **Fallback:** Local OCR fails or gate fails → **`processReceiptVision`** produces same `done`/`blurry`/tier outcomes as pre-redesign uploads.
6. **Classify fail:** Valid ocrDraft but `classifyReceiptText` throws → auto Vision same request.
7. **Tax:** `tax_amount` still only from `computeTaxAmount` after classify or Vision.
8. **Retry:** `/process` tries text classify when gate passes; otherwise Vision — identical to today.
9. **Cost:** Staging sample 100 receipts → Vision rate ≤10% (tune gate before prod); goal ≤5%.
10. **Build:** OCR WASM lazy-loaded; main bundle size increase <150KB gzip (loader only).
11. **Parity:** OCR-fail receipts match legacy Vision-only outcomes.
12. **Regression:** Existing merge / pendingUpload / watcher unchanged.

Items 12–14 (events, background sync, Event Store) — **Phase 2**.

---

## §15 Out of scope (Phase 1)

- UI changes
- Event Queue / Event Store / `/api/sync/events`
- Sync redesign (done lock, WorkerSession module)
- 1099 document path · Paddle

---

## §16–§18 Phase 2 (deferred)

See [`docs/tech/11-ocr-pipeline-design.md`](../../tech/11-ocr-pipeline-design.md) §16 and [receipt-lifecycle-sync-redesign-design.md](./2026-06-19-receipt-lifecycle-sync-redesign-design.md).

---

## §19 Document index

- **Chinese technical design (authoritative):** [`docs/tech/11-ocr-pipeline-design.md`](../../tech/11-ocr-pipeline-design.md)
- Implementation plan: TBD (`docs/superpowers/plans/2026-06-19-ocr-pipeline-redesign.md`)

**Phase 1 approved.** No UI changes. Data consistency in Phase 2.
