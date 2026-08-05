import { isReceiptFiled } from "@/lib/receipts/filedStatus";
import type { Receipt } from "@/lib/types";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

type ReceiptDeleteGuard = Pick<
  Receipt | StoredReceipt,
  "taxSeason" | "taxSeasonDate" | "isOnboardingDemo"
>;

/** Filed and demo receipts must not be deleted from the client. */
export function isClientReceiptDeleteAllowed(
  receipt: ReceiptDeleteGuard | null | undefined,
): boolean {
  if (!receipt || receipt.isOnboardingDemo) return false;
  return !isReceiptFiled(receipt);
}
