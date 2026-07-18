/** Same-origin Tesseract assets under public/tesseract (see scripts/copy-tesseract-assets.mjs). */
export const TESSERACT_PUBLIC_BASE = "/tesseract";

/**
 * Absolute origin for importScripts inside nested Workers.
 * Root-relative `/tesseract/...` fails in blob Workers spawned from ocrWorker
 * (`importScripts('/tesseract/worker.min.js')` → invalid URL).
 */
function assetOrigin(): string {
  try {
    if (typeof self !== "undefined" && self.location?.origin) {
      const { origin } = self.location;
      if (origin && origin !== "null") return origin;
    }
  } catch {
    /* ignore */
  }
  return "";
}

export function tesseractCreateWorkerOptions(): {
  workerPath: string;
  corePath: string;
  langPath: string;
  /** Load worker script directly — avoids blob+importScripts under nested Workers. */
  workerBlobURL: boolean;
  logger: () => void;
} {
  const origin = assetOrigin();
  const base = `${origin}${TESSERACT_PUBLIC_BASE}`;
  return {
    workerPath: `${base}/worker.min.js`,
    corePath: `${base}/core`,
    langPath: `${base}/lang`,
    workerBlobURL: false,
    logger: () => {},
  };
}
