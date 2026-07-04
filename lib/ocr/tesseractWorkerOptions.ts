/** Same-origin Tesseract assets under public/tesseract (see scripts/copy-tesseract-assets.mjs). */
export const TESSERACT_PUBLIC_BASE = "/tesseract";

export function tesseractCreateWorkerOptions(): {
  workerPath: string;
  corePath: string;
  langPath: string;
  logger: () => void;
} {
  return {
    workerPath: `${TESSERACT_PUBLIC_BASE}/worker.min.js`,
    corePath: `${TESSERACT_PUBLIC_BASE}/core`,
    langPath: `${TESSERACT_PUBLIC_BASE}/lang`,
    logger: () => {},
  };
}
