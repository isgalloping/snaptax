import { isReceiptFiled } from "@/lib/receipts/filedStatus";
import type { Receipt } from "@/lib/types";
import type { TaxRegion } from "@/lib/tax/types";
import { parseUtcISOString, toUtcISOString } from "@/lib/time/utc";
import { isPersistedReceiptId } from "@/lib/receipts/receiptId";
import { apiFetch } from "@/lib/client/ghostClient";

export type ApiReceipt = {
  id: string;
  status: Receipt["status"];
  amount: number | null;
  merchant: string | null;
  category: string | null;
  deductible?: boolean;
  currency?: string | null;
  taxAmount: number;
  dataRegion: TaxRegion;
  capturedAt: string;
  snapAt?: string | null;
  updatedAt: string;
  taxSeason: string | null;
  taxSeasonDate: string | null;
  hasImage: boolean;
};

export type ReceiptListResponse = {
  receipts: ApiReceipt[];
  taxSavedEstimate: number;
};

export function apiReceiptToLocal(r: ApiReceipt): Receipt {
  const timestamp = parseUtcISOString(r.snapAt ?? r.capturedAt);
  return {
    id: r.id,
    status: r.status,
    amount: r.amount ?? undefined,
    merchant: r.merchant ?? undefined,
    category: r.category ?? undefined,
    taxAmount: r.taxAmount,
    dataRegion: r.dataRegion,
    currency: r.currency ?? undefined,
    deductible: r.deductible,
    timestamp,
    updatedAt: r.updatedAt ? parseUtcISOString(r.updatedAt) : timestamp,
    taxSeason: r.taxSeason ?? undefined,
    taxSeasonDate: r.taxSeasonDate
      ? parseUtcISOString(r.taxSeasonDate)
      : undefined,
    hasRemoteImage: r.hasImage,
    pendingUpload: false,
  };
}

export type ReceiptImageUrlResponse = {
  url: string;
  expiresAt: string;
};

export async function fetchReceiptImageUrl(
  id: string,
): Promise<ReceiptImageUrlResponse> {
  if (!isPersistedReceiptId(id)) throw new Error("FETCH_RECEIPT_IMAGE_FAILED");
  const res = await apiFetch(`/api/receipts/${id}/image`);
  if (!res.ok) throw new Error("FETCH_RECEIPT_IMAGE_FAILED");
  return (await res.json()) as ReceiptImageUrlResponse;
}

export function sumUnfiledLocalTaxSaved(receipts: Receipt[]): number {
  return receipts.reduce((sum, r) => {
    if (r.status !== "done" || r.taxAmount == null || isReceiptFiled(r)) {
      return sum;
    }
    return sum + r.taxAmount;
  }, 0);
}

export function sumLocalTaxSaved(receipts: Receipt[]): number {
  return sumUnfiledLocalTaxSaved(receipts);
}

export async function fetchReceiptList(
  limit = 100,
): Promise<ReceiptListResponse> {
  const res = await apiFetch(
    `/api/receipts?limit=${limit}&orderBy=updatedAt`,
  );
  if (!res.ok) throw new Error("FETCH_RECEIPTS_FAILED");
  return (await res.json()) as ReceiptListResponse;
}

export async function fetchReceiptById(id: string): Promise<ApiReceipt> {
  if (!isPersistedReceiptId(id)) throw new Error("FETCH_RECEIPT_FAILED");
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

export type ProcessTriggerResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "failed"; status: number };

export async function triggerReceiptProcess(
  id: string,
): Promise<ProcessTriggerResult> {
  if (!isPersistedReceiptId(id)) {
    return { ok: false, reason: "not_found", status: 404 };
  }
  const res = await apiFetch(`/api/receipts/${id}/process`, { method: "POST" });
  if (res.ok) return { ok: true };
  if (res.status === 404) return { ok: false, reason: "not_found", status: 404 };
  return { ok: false, reason: "failed", status: res.status };
}

export async function patchReceiptCategory(
  id: string,
  category: string,
): Promise<ApiReceipt> {
  if (!isPersistedReceiptId(id)) throw new Error("PATCH_RECEIPT_CATEGORY_FAILED");
  const res = await apiFetch(`/api/receipts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
  });
  if (!res.ok) throw new Error("PATCH_RECEIPT_CATEGORY_FAILED");
  return (await res.json()) as ApiReceipt;
}

export async function deleteReceiptRemote(id: string): Promise<void> {
  if (!isPersistedReceiptId(id)) return;
  const res = await apiFetch(`/api/receipts/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error("DELETE_RECEIPT_FAILED");
}
