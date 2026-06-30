import { fitInsideDimensions } from "@/lib/camera/imageDimensions";

export const OCR_MAX_EDGE =
  Number(process.env.NEXT_PUBLIC_OCR_MAX_EDGE) || 1280;
export const OCR_JPEG_QUALITY =
  Number(process.env.NEXT_PUBLIC_OCR_JPEG_QUALITY) || 0.7;
export const OCR_ROI_ASPECT_THRESHOLD = 2;
export const OCR_ROI_CENTER_RATIO = 0.85;

/** Center crop when aspect ratio exceeds threshold (Phase 1.1 / O3). */
export function computeCenterRoiCrop(
  width: number,
  height: number,
  ratio = OCR_ROI_CENTER_RATIO,
  aspectThreshold = OCR_ROI_ASPECT_THRESHOLD,
): { sx: number; sy: number; sw: number; sh: number } | null {
  if (width <= 0 || height <= 0) return null;
  const aspect = Math.max(width, height) / Math.min(width, height);
  if (aspect <= aspectThreshold) return null;
  const sw = Math.round(width * ratio);
  const sh = Math.round(height * ratio);
  return {
    sx: Math.round((width - sw) / 2),
    sy: Math.round((height - sh) / 2),
    sw,
    sh,
  };
}

function assertBrowser(): void {
  if (typeof OffscreenCanvas === "undefined") {
    throw new Error("preprocessReceiptImageForOcr requires a browser/worker canvas");
  }
}

async function blobToBitmap(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob);
}

async function encodeJpeg(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type: "image/jpeg", quality });
  }
  return new Promise((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (b) => (b ? resolve(b) : reject(new Error("JPEG encode failed"))),
      "image/jpeg",
      quality,
    );
  });
}

/** Resize, optional ROI crop, JPEG encode for local OCR input. */
export async function preprocessReceiptImageForOcr(
  file: Blob,
): Promise<{ blob: Blob; width: number; height: number; roiApplied: boolean }> {
  assertBrowser();
  const bitmap = await blobToBitmap(file);
  try {
    const fitted = fitInsideDimensions(
      bitmap.width,
      bitmap.height,
      OCR_MAX_EDGE,
    );
    const roi = computeCenterRoiCrop(fitted.width, fitted.height);
    const outW = roi?.sw ?? fitted.width;
    const outH = roi?.sh ?? fitted.height;

    const canvas = new OffscreenCanvas(outW, outH);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    if (roi) {
      const scaleX = bitmap.width / fitted.width;
      const scaleY = bitmap.height / fitted.height;
      ctx.drawImage(
        bitmap,
        roi.sx * scaleX,
        roi.sy * scaleY,
        roi.sw * scaleX,
        roi.sh * scaleY,
        0,
        0,
        outW,
        outH,
      );
    } else {
      ctx.drawImage(
        bitmap,
        0,
        0,
        bitmap.width,
        bitmap.height,
        0,
        0,
        outW,
        outH,
      );
    }

    const blob = await encodeJpeg(canvas, OCR_JPEG_QUALITY);
    return { blob, width: outW, height: outH, roiApplied: roi != null };
  } finally {
    bitmap.close();
  }
}
