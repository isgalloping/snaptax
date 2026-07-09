import { fetchReceiptImageUrlCached } from "@/lib/client/receiptImageCache";
import { isPersistedReceiptId } from "@/lib/receipts/receiptId";
import { loadPhoto } from "@/lib/storage/receiptDb";

export type ExportImageSource = "local" | "remote";

export type ResolveExportReceiptImageDeps = {
  loadPhoto?: (id: string) => Promise<Blob | null>;
  fetchRemoteBlob?: (id: string) => Promise<Blob | null>;
};

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

  const fetchRemote = deps.fetchRemoteBlob ?? fetchRemoteReceiptImageBlob;
  const remote = await fetchRemote(receiptId);
  if (remote) {
    return { blob: remote, source: "remote" };
  }

  return null;
}
