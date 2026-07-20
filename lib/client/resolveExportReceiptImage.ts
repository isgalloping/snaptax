import {
  canFetchRemoteReceiptImage,
  fetchReceiptImageUrlCached,
} from "@/lib/client/receiptImageCache";
import { isPersistedReceiptId } from "@/lib/receipts/receiptId";
import { loadPhoto, loadReceipt } from "@/lib/storage/receiptDb";
import type { Receipt } from "@/lib/types";

export type ExportImageSource = "local" | "remote";

export type ResolveExportReceiptImageDeps = {
  loadPhoto?: (id: string) => Promise<Blob | null>;
  fetchRemoteBlob?: (id: string) => Promise<Blob | null>;
  loadReceiptMeta?: (
    id: string,
  ) => Promise<Pick<Receipt, "hasRemoteImage" | "pendingUpload"> | null>;
};

async function defaultLoadReceiptMeta(
  receiptId: string,
): Promise<Pick<Receipt, "hasRemoteImage" | "pendingUpload"> | null> {
  const receipt = await loadReceipt(receiptId);
  if (!receipt) return null;
  return {
    hasRemoteImage: receipt.hasRemoteImage,
    pendingUpload: receipt.pendingUpload,
  };
}

async function fetchRemoteReceiptImageBlob(
  receiptId: string,
): Promise<Blob | null> {
  if (!isPersistedReceiptId(receiptId)) return null;
  try {
    const { url } = await fetchReceiptImageUrlCached(receiptId);
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

/** Prefer OPFS full image; fall back to signed remote URL fetch. */
export async function resolveExportReceiptImageBlob(
  receiptId: string,
  deps: ResolveExportReceiptImageDeps = {},
): Promise<{ blob: Blob; source: ExportImageSource } | null> {
  const loadLocal = deps.loadPhoto ?? loadPhoto;
  let local: Blob | null = null;
  try {
    local = await loadLocal(receiptId);
  } catch {
    local = null;
  }
  if (local) {
    return { blob: local, source: "local" };
  }

  const shouldCheckRemoteMeta =
    deps.loadReceiptMeta != null || deps.fetchRemoteBlob == null;
  if (shouldCheckRemoteMeta) {
    const loadReceiptMeta = deps.loadReceiptMeta ?? defaultLoadReceiptMeta;
    const meta = await loadReceiptMeta(receiptId);
    if (meta && !canFetchRemoteReceiptImage(meta)) {
      return null;
    }
  }

  const fetchRemote =
    deps.fetchRemoteBlob ??
    ((id: string) => fetchRemoteReceiptImageBlob(id));
  const remote = await fetchRemote(receiptId);
  if (remote) {
    return { blob: remote, source: "remote" };
  }

  return null;
}
