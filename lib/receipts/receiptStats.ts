import type { Receipt } from "@/lib/types";

export type ReceiptStatusCounts = {
  all: number;
  done: number;
  processing: number;
  blurry: number;
};

export function countByStatus(receipts: Receipt[]): ReceiptStatusCounts {
  let done = 0;
  let processing = 0;
  let blurry = 0;
  for (const r of receipts) {
    if (r.status === "done") done++;
    else if (r.status === "processing") processing++;
    else if (r.status === "blurry") blurry++;
  }
  return { all: receipts.length, done, processing, blurry };
}

export function sumDoneExpenses(receipts: Receipt[]): number {
  return receipts.reduce((sum, r) => {
    if (r.status === "done" && r.amount != null) return sum + r.amount;
    return sum;
  }, 0);
}
