import type { Receipt } from "@/lib/types";
import type { TaxRegion } from "@/lib/tax/types";
import { parseUtcISOString, toUtcISOString } from "@/lib/time/utc";
import { apiFetch } from "@/lib/client/ghostClient";

export type ApiReceipt = {
  id: string;
  status: Receipt["status"];
  amount: number | null;
  merchant: string | null;
  category: string | null;
  deductible?: boolean;
  taxAmount: number;
  dataRegion: TaxRegion;
  capturedAt: string;
  snapAt?: string | null;
};

export type ReceiptListResponse = {
  receipts: ApiReceipt[];
  taxSavedEstimate: number;
};

export function apiReceiptToLocal(r: ApiReceipt): Receipt {
  return {
    id: r.id,
    status: r.status,
    amount: r.amount ?? undefined,
    merchant: r.merchant ?? undefined,
    category: r.category ?? undefined,
    taxAmount: r.taxAmount,
    dataRegion: r.dataRegion,
    timestamp: parseUtcISOString(r.capturedAt),
    pendingUpload: false,
  };
}

export function sumLocalTaxSaved(receipts: Receipt[]): number {
  return receipts.reduce((sum, r) => {
    if (r.status === "done" && r.taxAmount != null) {
      return sum + r.taxAmount;
    }
    return sum;
  }, 0);
}

export async function fetchReceiptList(
  limit = 50,
): Promise<ReceiptListResponse> {
  const res = await apiFetch(`/api/receipts?limit=${limit}`);
  if (!res.ok) throw new Error("FETCH_RECEIPTS_FAILED");
  return (await res.json()) as ReceiptListResponse;
}

export async function fetchReceiptById(id: string): Promise<ApiReceipt> {
  const res = await apiFetch(`/api/receipts/${id}`);
  if (!res.ok) throw new Error("FETCH_RECEIPT_FAILED");
  return (await res.json()) as ApiReceipt;
}

export async function uploadReceipt(
  file: Blob,
  snapAt?: Date,
): Promise<ApiReceipt> {
  const form = new FormData();
  form.append("file", file);
  if (snapAt) {
    form.append("snapAt", toUtcISOString(snapAt));
  }
  const res = await apiFetch("/api/receipts", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: { code?: string };
    } | null;
    const code = body?.error?.code ?? "UPLOAD_FAILED";
    throw new Error(code);
  }
  const created = (await res.json()) as {
    id: string;
    status: Receipt["status"];
    taxAmount?: number;
    dataRegion?: TaxRegion;
  };
  return fetchReceiptById(created.id);
}

export async function pollReceiptUntilSettled(
  id: string,
  opts: { intervalMs?: number; maxAttempts?: number } = {},
): Promise<ApiReceipt> {
  const intervalMs = opts.intervalMs ?? 1500;
  const maxAttempts = opts.maxAttempts ?? 40;

  for (let i = 0; i < maxAttempts; i++) {
    const receipt = await fetchReceiptById(id);
    if (receipt.status !== "processing") return receipt;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return fetchReceiptById(id);
}

export async function deleteReceiptRemote(id: string): Promise<void> {
  const res = await apiFetch(`/api/receipts/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error("DELETE_RECEIPT_FAILED");
}
