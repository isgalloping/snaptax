import { createHash } from "crypto";
import sharp from "sharp";

export const DEFAULT_SIMILARITY_THRESHOLD = 10;

export function contentSha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** 64-bit difference hash (dHash) as 16-char hex. */
export async function computeImageFingerprint(bytes: Buffer): Promise<string> {
  const { data } = await sharp(bytes)
    .rotate()
    .resize(9, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let hash = BigInt(0);
  let bit = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = data[y * 9 + x] ?? 0;
      const right = data[y * 9 + x + 1] ?? 0;
      if (left > right) {
        hash |= BigInt(1) << BigInt(bit);
      }
      bit++;
    }
  }
  return hash.toString(16).padStart(16, "0");
}

export function hammingDistanceHex(a: string, b: string): number {
  const av = BigInt(`0x${a}`);
  const bv = BigInt(`0x${b}`);
  let xor = av ^ bv;
  let count = 0;
  while (xor > BigInt(0)) {
    count += Number(xor & BigInt(1));
    xor >>= BigInt(1);
  }
  return count;
}

export function findSimilarFingerprintMatch(
  candidates: { id: string; imageFingerprint: string }[],
  fingerprint: string,
  excludeId: string | null,
  threshold = DEFAULT_SIMILARITY_THRESHOLD,
): { id: string } | null {
  for (const candidate of candidates) {
    if (excludeId && candidate.id === excludeId) continue;
    if (hammingDistanceHex(candidate.imageFingerprint, fingerprint) <= threshold) {
      return { id: candidate.id };
    }
  }
  return null;
}

export function receiptImagePathname(
  receiptId: string,
  kind: "jpeg" | "png",
): string {
  return `receipts/${receiptId}.${kind === "jpeg" ? "jpg" : "png"}`;
}
