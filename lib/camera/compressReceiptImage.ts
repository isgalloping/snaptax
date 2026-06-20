import { fitInsideDimensions } from "@/lib/camera/imageDimensions";

export const RECEIPT_FULL_MAX_EDGE = 1280;
export const RECEIPT_FULL_JPEG_QUALITY = 0.75;
export const RECEIPT_FULL_JPEG_MIN_QUALITY = 0.65;
export const RECEIPT_FULL_TARGET_MAX_BYTES = 300_000;

export const RECEIPT_THUMB_MAX_EDGE = 480;
export const RECEIPT_THUMB_JPEG_QUALITY = 0.7;

function assertBrowser(): void {
  if (typeof document === "undefined") {
    throw new Error("compressReceiptImage requires a browser environment");
  }
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("JPEG encode failed"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

async function drawToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported");
  }
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

export async function compressImageToJpeg(
  file: Blob,
  opts: {
    maxEdge: number;
    quality: number;
    minQuality: number;
    maxBytes: number;
  },
): Promise<{ blob: Blob; width: number; height: number }> {
  assertBrowser();
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = fitInsideDimensions(
      bitmap.width,
      bitmap.height,
      opts.maxEdge,
    );
    const canvas = await drawToCanvas(bitmap, width, height);

    let quality = opts.quality;
    let blob = await canvasToJpegBlob(canvas, quality);
    while (blob.size > opts.maxBytes && quality > opts.minQuality) {
      quality = Math.max(opts.minQuality, quality - 0.05);
      blob = await canvasToJpegBlob(canvas, quality);
    }

    return { blob, width, height };
  } finally {
    bitmap.close();
  }
}

export async function compressReceiptImage(
  file: Blob,
): Promise<{ blob: Blob; width: number; height: number }> {
  return compressImageToJpeg(file, {
    maxEdge: RECEIPT_FULL_MAX_EDGE,
    quality: RECEIPT_FULL_JPEG_QUALITY,
    minQuality: RECEIPT_FULL_JPEG_MIN_QUALITY,
    maxBytes: RECEIPT_FULL_TARGET_MAX_BYTES,
  });
}

export async function generateReceiptThumbnail(
  full: Blob,
): Promise<{ blob: Blob; width: number; height: number }> {
  return compressImageToJpeg(full, {
    maxEdge: RECEIPT_THUMB_MAX_EDGE,
    quality: RECEIPT_THUMB_JPEG_QUALITY,
    minQuality: RECEIPT_THUMB_JPEG_QUALITY,
    maxBytes: Number.MAX_SAFE_INTEGER,
  });
}
