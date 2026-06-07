import type { StoredReceipt } from "@/lib/storage/receiptDb";

export const MAX_WRITE_BUDGET = 5;

export function getBudget(
  receipt: Pick<StoredReceipt, "writeBudgetRemaining">,
): number {
  return receipt.writeBudgetRemaining ?? MAX_WRITE_BUDGET;
}

export function isSyncStuck(
  receipt: Pick<StoredReceipt, "writeBudgetRemaining">,
): boolean {
  return getBudget(receipt) <= 0;
}

export function withFreshBudget<T extends StoredReceipt>(receipt: T): T {
  return { ...receipt, writeBudgetRemaining: MAX_WRITE_BUDGET };
}

export function recordWriteFailure<T extends StoredReceipt>(receipt: T): T {
  const next = Math.max(0, getBudget(receipt) - 1);
  return { ...receipt, writeBudgetRemaining: next };
}

export function resetBudget<T extends StoredReceipt>(receipt: T): T {
  return { ...receipt, writeBudgetRemaining: MAX_WRITE_BUDGET };
}
