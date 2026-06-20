import { parseReceipt } from "@/lib/ocr/parseReceipt";
import type { LocalOcrResult, OcrDraftPayload } from "@/lib/ocr/types";

let workerPromise: Promise<import("tesseract.js").Worker> | null = null;

async function getTesseractWorker(): Promise<import("tesseract.js").Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: () => {},
      });
      return worker;
    })();
  }
  return workerPromise;
}

export function shouldSkipLocalOcr(): boolean {
  if (typeof navigator === "undefined") return true;
  if (process.env.NEXT_PUBLIC_SKIP_LOCAL_OCR === "1") return true;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof mem === "number" && mem <= 2) return true;
  return false;
}

async function tinyWarmupJpeg(): Promise<Blob> {
  const canvas = new OffscreenCanvas(2, 2);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 2, 2);
  return canvas.convertToBlob({ type: "image/jpeg", quality: 0.5 });
}

/** Download eng model + init worker (call on app boot / worker preload). */
export async function warmTesseractWorker(): Promise<void> {
  if (shouldSkipLocalOcr()) return;
  const blob = await tinyWarmupJpeg();
  await runTesseractOcr(blob);
}

export async function runTesseractOcr(image: Blob): Promise<LocalOcrResult> {
  const started = Date.now();
  try {
    const worker = await getTesseractWorker();
    const {
      data: { text, confidence },
    } = await worker.recognize(image);
    const normalized = text?.trim() ?? "";
    const conf = Math.min(1, Math.max(0, (confidence ?? 0) / 100));
    return {
      text: normalized,
      confidence: conf,
      engine: "tesseract",
      durationMs: Date.now() - started,
    };
  } catch {
    return {
      text: "",
      confidence: 0,
      engine: "skipped",
      durationMs: Date.now() - started,
    };
  }
}

export async function runLocalOcr(image: Blob): Promise<LocalOcrResult> {
  if (shouldSkipLocalOcr()) {
    return {
      text: "",
      confidence: 0,
      engine: "skipped",
      durationMs: 0,
    };
  }
  return runTesseractOcr(image);
}

export function buildOcrDraft(
  result: LocalOcrResult,
  opts?: { preprocessVersion?: 1 | 2 },
): OcrDraftPayload {
  const parsed = parseReceipt(result.text);
  return {
    text: result.text,
    confidence: result.confidence,
    parsed,
    engine: result.engine,
    preprocessVersion: opts?.preprocessVersion ?? 1,
  };
}

export async function runLocalOcrDraft(image: Blob): Promise<OcrDraftPayload> {
  const result = await runLocalOcr(image);
  return buildOcrDraft(result);
}
