import sharp from "sharp";

const MAX_EDGE = Number(process.env.RECEIPT_VISION_MAX_EDGE ?? 1568);
const JPEG_QUALITY = Number(process.env.RECEIPT_VISION_JPEG_QUALITY ?? 82);
const SKIP_RESIZE_BELOW_BYTES = Number(
  process.env.RECEIPT_VISION_SKIP_RESIZE_BELOW_BYTES ?? 800_000,
);

export async function prepareVisionImage(
  buffer: Buffer,
  mime: "image/jpeg" | "image/png",
): Promise<{ buffer: Buffer; mime: "image/jpeg" | "image/png" }> {
  const meta = await sharp(buffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const withinEdge = width <= MAX_EDGE && height <= MAX_EDGE;
  const smallEnough =
    mime === "image/jpeg" && buffer.length <= SKIP_RESIZE_BELOW_BYTES;

  if (withinEdge && smallEnough) {
    return { buffer, mime };
  }

  const out = await sharp(buffer)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  return { buffer: out, mime: "image/jpeg" };
}
