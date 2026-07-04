/// <reference lib="webworker" />

import { buildOcrDraft, runTesseractOcr, shouldSkipLocalOcr, warmTesseractWorker } from "@/lib/ocr/runLocalOcr";
import { preprocessReceiptImageForOcr } from "@/lib/ocr/preprocessImage";
import type {
  OcrWorkerRequest,
  OcrWorkerResponse,
} from "@/lib/workers/ocrWorkerProtocol";

declare const self: DedicatedWorkerGlobalScope;

let preloadStarted = false;

async function handleRun(
  receiptId: string,
  imageBlob: Blob,
): Promise<OcrWorkerResponse> {
  const started = Date.now();
  if (shouldSkipLocalOcr()) {
    const draft = buildOcrDraft({
      text: "",
      confidence: 0,
      engine: "skipped",
      durationMs: 0,
    });
    return { kind: "ok", receiptId, draft, durationMs: Date.now() - started };
  }

  try {
    const { blob, roiApplied } = await preprocessReceiptImageForOcr(imageBlob);
    const ocr = await runTesseractOcr(blob);
    const draft = buildOcrDraft(ocr, { preprocessVersion: roiApplied ? 2 : 1 });
    return { kind: "ok", receiptId, draft, durationMs: Date.now() - started };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "ocr_failed";
    return { kind: "err", receiptId, reason };
  }
}

async function handlePreload(): Promise<void> {
  if (preloadStarted || shouldSkipLocalOcr()) return;
  preloadStarted = true;
  await warmTesseractWorker();
}

self.onmessage = (event: MessageEvent<OcrWorkerRequest>) => {
  const msg = event.data;
  if (msg.kind === "preload") {
    void handlePreload().then(() => {
      const res: OcrWorkerResponse = { kind: "preloaded" };
      self.postMessage(res);
    });
    return;
  }

  if (msg.kind === "run") {
    void handleRun(msg.receiptId, msg.imageBlob).then((res) => {
      self.postMessage(res);
    });
  }
};

export {};
