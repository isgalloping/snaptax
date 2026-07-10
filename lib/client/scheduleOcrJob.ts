import { buildOcrDraft, shouldSkipLocalOcr } from "@/lib/ocr/runLocalOcr";
import {
  loadPhoto,
  loadReceipt,
  saveReceipt,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";
import type {
  OcrWorkerRequest,
  OcrWorkerResponse,
} from "@/lib/workers/ocrWorkerProtocol";

export const OCR_MAX_QUEUE_DEPTH = 3;
export const OCR_WORKER_TIMEOUT_MS = 45_000;
export const DEFAULT_WAIT_FOR_OCR_MS = 120_000;
const pending: string[] = [];
const queued = new Set<string>();
const inFlight = new Set<string>();
const ocrFinished = new Set<string>();
const ocrScheduled = new Set<string>();
/** True while batch camera overlay is open — gates auto-upload until session ends. */
let batchCaptureSessionActive = false;
let running = 0;
let worker: Worker | null = null;
let ocrCompleteHandler: ((receiptId: string) => void) | null = null;

export function activeOcrQueueDepth(): number {
  return pending.length + inFlight.size;
}

/** Whether a new OCR job can enter the FIFO worker queue. */
export function shouldEnqueueOcrJob(
  depth = activeOcrQueueDepth(),
): boolean {
  return depth < OCR_MAX_QUEUE_DEPTH;
}

export function isOcrJobPending(receiptId: string): boolean {
  return ocrScheduled.has(receiptId) && !ocrFinished.has(receiptId);
}

/** @deprecated Do not gate upload flush; OCR runs in parallel with upload. */
export function shouldBlockUploadForOcr(
  receipt: Pick<StoredReceipt, "id" | "ocrDraft">,
): boolean {
  if (shouldSkipLocalOcr()) return false;
  if (receipt.ocrDraft) return false;
  return isOcrJobPending(receipt.id);
}

function scheduleIdle(fn: () => void): void {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => fn(), { timeout: 5000 });
    return;
  }
  globalThis.setTimeout(fn, 0);
}

function getOcrWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("../workers/ocrWorker.ts", import.meta.url));
  }
  return worker;
}

function markOcrFinished(receiptId: string): void {
  inFlight.delete(receiptId);
  queued.delete(receiptId);
  ocrFinished.add(receiptId);
}

function runOcrInWorker(
  receiptId: string,
  imageBlob: Blob,
): Promise<OcrWorkerResponse> {
  return new Promise((resolve) => {
    const w = getOcrWorker();
    const onMessage = (event: MessageEvent<OcrWorkerResponse>) => {
      const data = event.data;
      if (data.kind === "preloaded") return;
      if ("receiptId" in data && data.receiptId !== receiptId) return;
      cleanup();
      resolve(data);
    };
    const timer = window.setTimeout(() => {
      cleanup();
      resolve({ kind: "err", receiptId, reason: "timeout" });
    }, OCR_WORKER_TIMEOUT_MS);
    const cleanup = () => {
      window.clearTimeout(timer);
      w.removeEventListener("message", onMessage);
    };
    w.addEventListener("message", onMessage);
    const req: OcrWorkerRequest = {
      kind: "run",
      receiptId,
      imageBlob,
    };
    w.postMessage(req);
  });
}

async function persistOcrDraft(
  receiptId: string,
  draft: StoredReceipt["ocrDraft"],
): Promise<void> {
  const latest = await loadReceipt(receiptId);
  if (!latest) return;
  if (latest.status !== "processing") return;
  await saveReceipt({ ...latest, ocrDraft: draft });
}

/** Queue full or device skip — persist skipped draft and finalize. */
export async function persistSkippedOcrDraft(
  receiptId: string,
  reason = "queue_or_env_skip",
): Promise<void> {
  const draft = buildOcrDraft({
    text: "",
    confidence: 0,
    engine: "skipped",
    durationMs: 0,
  });
  await persistOcrDraft(receiptId, draft);
  emitOcrCompletedLifecycleEvent(receiptId, {
    source: "skipped",
    reason,
    engine: "skipped",
  });
  markOcrFinished(receiptId);
  notifyOcrComplete(receiptId);
}

function emitOcrCompletedLifecycleEvent(
  receiptId: string,
  payload: Record<string, unknown>,
): void {
  void import("@/lib/client/emitReceiptLifecycleEvent").then(
    ({ emitReceiptLifecycleEvent }) =>
      emitReceiptLifecycleEvent({
        receiptId,
        type: "OCR_COMPLETED",
        payload,
      }),
  );
}

function notifyOcrComplete(receiptId: string): void {
  ocrCompleteHandler?.(receiptId);
}

async function processReceiptOcr(receiptId: string): Promise<void> {
  inFlight.add(receiptId);
  try {
    const receipt = await loadReceipt(receiptId);
    if (!receipt || receipt.status !== "processing") return;

    const blob = await loadPhoto(receiptId);
    if (!blob) {
      await persistOcrDraft(
        receiptId,
        buildOcrDraft({
          text: "",
          confidence: 0,
          engine: "skipped",
          durationMs: 0,
        }),
      );
      emitOcrCompletedLifecycleEvent(receiptId, {
        source: "skipped",
        reason: "no_photo",
        engine: "skipped",
      });
      return;
    }

    const started = Date.now();
    const result = await runOcrInWorker(receiptId, blob);
    if (result.kind === "ok") {
      await persistOcrDraft(receiptId, result.draft);
      emitOcrCompletedLifecycleEvent(receiptId, {
        source: "local_ocr",
        engine: result.draft.engine,
        confidence: result.draft.confidence,
      });
      if (
        typeof window !== "undefined" &&
        process.env.NODE_ENV === "development"
      ) {
        const wallMs = Date.now() - started;
        console.log(
          `[biz.ocr] stage=local_ocr receiptId=${receiptId} durationMs=${wallMs} engine=${result.draft.engine} extractionSource=local_ocr preprocessVersion=${result.draft.preprocessVersion}${wallMs > 5000 ? " (cold start — preload on next launch should be faster)" : ""}`,
        );
      }
    } else {
      await persistOcrDraft(
        receiptId,
        buildOcrDraft({
          text: "",
          confidence: 0,
          engine: "skipped",
          durationMs: Date.now() - started,
        }),
      );
      emitOcrCompletedLifecycleEvent(receiptId, {
        source: "skipped",
        reason: result.kind === "err" ? result.reason : "local_ocr_failed",
        engine: "skipped",
      });
    }
  } finally {
    markOcrFinished(receiptId);
    notifyOcrComplete(receiptId);
  }
}

function pumpQueue(): void {
  while (running < 1 && pending.length > 0) {
    const id = pending.shift();
    if (!id) break;
    running += 1;
    void processReceiptOcr(id)
      .catch(() => {
        markOcrFinished(id);
        notifyOcrComplete(id);
      })
      .finally(() => {
        running -= 1;
        pumpQueue();
      });
  }
}

/** Begin deferring auto-upload for all receipts until batch camera closes. */
export function beginBatchCaptureDefer(): void {
  batchCaptureSessionActive = true;
}

/** End batch deferral — call when batch camera closes (Done / Back). */
export function endBatchCaptureDefer(): void {
  batchCaptureSessionActive = false;
}

/** @deprecated Use beginBatchCaptureDefer / endBatchCaptureDefer (session-scoped). */
export function deferBatchOcrUpload(_receiptIds: string[]): void {
  beginBatchCaptureDefer();
}

/** @deprecated Use endBatchCaptureDefer (session-scoped). */
export function releaseBatchOcrUpload(_receiptIds: string[]): void {
  endBatchCaptureDefer();
}

export function isBatchOcrUploadDeferred(_receiptId: string): boolean {
  return batchCaptureSessionActive;
}

/** Wait until scheduled OCR jobs for these receipts finish (or timeout). */
export function waitForOcrJobs(
  receiptIds: string[],
  timeoutMs = DEFAULT_WAIT_FOR_OCR_MS,
): Promise<void> {
  const targets = [...new Set(receiptIds)];
  if (targets.length === 0) return Promise.resolve();

  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve) => {
    const tick = () => {
      const waiting = targets.some((id) => isOcrJobPending(id));
      if (!waiting || Date.now() >= deadline) {
        resolve();
        return;
      }
      globalThis.setTimeout(tick, 50);
    };
    tick();
  });
}

/** Called after local OCR finishes (success, skip, timeout, or error). */
export function setOcrCompleteHandler(
  handler: ((receiptId: string) => void) | null,
): void {
  ocrCompleteHandler = handler;
}

/** Re-schedule OCR after reload for processing rows without a draft yet. */
export async function resumePendingOcrJobsFromStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  const { loadAllReceipts } = await import("@/lib/storage/receiptDb");
  const receipts = await loadAllReceipts();
  for (const receipt of receipts) {
    if (
      receipt.status === "processing" &&
      receipt.pendingUpload &&
      !receipt.ocrDraft
    ) {
      scheduleOcrJob(receipt.id);
    }
  }
}

/** Schedule local OCR for a receipt — non-blocking, FIFO, max depth 3. */
export function scheduleOcrJob(receiptId: string): void {
  if (typeof window === "undefined") return;
  if (queued.has(receiptId) || inFlight.has(receiptId)) return;
  if (isOcrJobPending(receiptId)) return;
  if (ocrFinished.has(receiptId)) {
    ocrFinished.delete(receiptId);
  }
  ocrScheduled.add(receiptId);

  if (shouldSkipLocalOcr()) {
    void persistSkippedOcrDraft(receiptId, "env_skip").catch(() => {
      markOcrFinished(receiptId);
      notifyOcrComplete(receiptId);
    });
    return;
  }

  if (!shouldEnqueueOcrJob()) {
    void persistSkippedOcrDraft(receiptId, "queue_full").catch(() => {
      markOcrFinished(receiptId);
      notifyOcrComplete(receiptId);
    });
    return;
  }

  pending.push(receiptId);
  queued.add(receiptId);
  scheduleIdle(() => pumpQueue());
}

export function preloadOcrEngine(): void {
  if (typeof window === "undefined") return;
  scheduleIdle(() => {
    const w = getOcrWorker();
    const req: OcrWorkerRequest = { kind: "preload" };
    w.postMessage(req);
  });
}

/** Test-only: simulate queue state. */
export function simulateOcrJobScheduledForTests(
  receiptId: string,
  opts?: { inQueue?: boolean; inFlight?: boolean; finished?: boolean },
): void {
  ocrScheduled.add(receiptId);
  if (opts?.inQueue) {
    pending.push(receiptId);
    queued.add(receiptId);
  }
  if (opts?.inFlight) {
    inFlight.add(receiptId);
    queued.add(receiptId);
  }
  if (opts?.finished) {
    markOcrFinished(receiptId);
  }
}

/** Test-only reset — not for production UI. */
export function resetOcrJobStateForTests(): void {
  pending.length = 0;
  queued.clear();
  inFlight.clear();
  ocrFinished.clear();
  ocrScheduled.clear();
  batchCaptureSessionActive = false;
  running = 0;
}
