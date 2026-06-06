const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47];

export function assertValidReceiptImage(bytes: Buffer): "jpeg" | "png" {
  const max = Number(process.env.RECEIPT_MAX_BYTES ?? 5_242_880);
  if (bytes.length > max) throw new Error("FILE_TOO_LARGE");
  if (JPEG.every((b, i) => bytes[i] === b)) return "jpeg";
  if (PNG.every((b, i) => bytes[i] === b)) return "png";
  throw new Error("INVALID_FILE_TYPE");
}

export function mimeForKind(kind: "jpeg" | "png"): "image/jpeg" | "image/png" {
  return kind === "jpeg" ? "image/jpeg" : "image/png";
}
