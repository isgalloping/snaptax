import {
  apiReceiptToLocal,
  fetchReceiptList,
  triggerReceiptProcess,
  type ApiReceipt,
} from "@/lib/client/receiptApi";

export type PollReceiptResult = {
  receipt: ApiReceipt;
  settled: boolean;
};

function fallbackProcessing(id: string): ApiReceipt {
  const now = new Date().toISOString();
  return {
    id,
    status: "processing",
    amount: null,
    merchant: null,
    category: null,
    taxAmount: 0,
    dataRegion: "us",
    capturedAt: now,
    updatedAt: now,
    taxSeason: null,
    taxSeasonDate: null,
    hasImage: false,
  };
}

/** Poll one receipt via list endpoint (one request per tick, not GET /:id). */
export async function pollReceiptUntilSettled(
  id: string,
  opts: {
    intervalMs?: number;
    maxAttempts?: number;
    retryMaxAttempts?: number;
  } = {},
): Promise<PollReceiptResult> {
  const intervalMs = opts.intervalMs ?? 2000;
  const maxAttempts = opts.maxAttempts ?? 15;
  const retryMaxAttempts = opts.retryMaxAttempts ?? 10;

  async function findInList(): Promise<ApiReceipt | null> {
    const { receipts } = await fetchReceiptList();
    return receipts.find((r) => r.id === id) ?? null;
  }

  async function pollLoop(attempts: number): Promise<ApiReceipt | null> {
    for (let i = 0; i < attempts; i++) {
      const receipt = await findInList();
      if (!receipt) return null;
      if (receipt.status !== "processing") return receipt;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return findInList();
  }

  let receipt = await pollLoop(maxAttempts);
  if (!receipt) return { receipt: fallbackProcessing(id), settled: false };
  if (receipt.status !== "processing") return { receipt, settled: true };

  const result = await triggerReceiptProcess(id);
  if (!result.ok) {
    return { receipt, settled: false };
  }

  receipt = await pollLoop(retryMaxAttempts);
  if (!receipt) return { receipt: fallbackProcessing(id), settled: false };
  return { receipt, settled: receipt.status !== "processing" };
}

export function applyApiReceiptToStored(receipt: ApiReceipt) {
  return { ...apiReceiptToLocal(receipt), pendingUpload: false as const };
}
