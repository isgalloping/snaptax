import { isReceiptFiled } from "@/lib/receipts/filedStatus";
import type { Receipt } from "@/lib/types";

export type ReceiptWithSha = Receipt & { contentSha256?: string };

export function findLocalDuplicateBySha(
  receipts: ReceiptWithSha[],
  sha: string,
  excludeId?: string | null,
): ReceiptWithSha | null {
  for (const receipt of receipts) {
    if (excludeId && receipt.id === excludeId) continue;
    if (receipt.isOnboardingDemo) continue;
    if (isReceiptFiled(receipt)) continue;
    if (receipt.contentSha256 === sha) return receipt;
  }
  return null;
}
