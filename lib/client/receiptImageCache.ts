import type { Receipt } from "@/lib/types";
import {
  fetchReceiptImageUrl,
  type ReceiptImageUrlResponse,
} from "@/lib/client/receiptApi";
import { isPersistedReceiptId } from "@/lib/receipts/receiptId";

const CACHE_BUFFER_MS = 60_000;

type CacheRow = { url: string; expiresAtMs: number };

type ReceiptImageCacheDeps = {
  fetchUrl?: typeof fetchReceiptImageUrl;
};

const urlCache = new Map<string, CacheRow>();
const inflight = new Map<string, Promise<ReceiptImageUrlResponse | null>>();

export function clearReceiptImageCache(): void {
  urlCache.clear();
  inflight.clear();
}

export function peekCachedReceiptImageUrl(id: string): string | null {
  const row = urlCache.get(id);
  if (!row || row.expiresAtMs <= Date.now() + CACHE_BUFFER_MS) return null;
  return row.url;
}

export async function fetchReceiptImageUrlCached(
  id: string,
  deps: ReceiptImageCacheDeps = {},
): Promise<ReceiptImageUrlResponse> {
  const fetchUrl = deps.fetchUrl ?? fetchReceiptImageUrl;
  const cached = urlCache.get(id);
  if (cached && cached.expiresAtMs > Date.now() + CACHE_BUFFER_MS) {
    return {
      url: cached.url,
      expiresAt: new Date(cached.expiresAtMs).toISOString(),
    };
  }

  let pending = inflight.get(id);
  if (!pending) {
    pending = fetchUrl(id)
      .then((result) => {
        urlCache.set(id, {
          url: result.url,
          expiresAtMs: Date.parse(result.expiresAt),
        });
        return result;
      })
      .catch(() => null)
      .finally(() => {
        inflight.delete(id);
      });
    inflight.set(id, pending);
  }

  const result = await pending;
  if (!result) throw new Error("FETCH_RECEIPT_IMAGE_FAILED");
  return result;
}

/** Server signed URL is only available after upload (hasRemoteImage). */
export function canFetchRemoteReceiptImage(
  receipt: Pick<Receipt, "hasRemoteImage" | "pendingUpload">,
): boolean {
  if (receipt.pendingUpload) return false;
  return receipt.hasRemoteImage === true;
}

/** Warm signed URL while user is opening detail. */
export function prefetchReceiptImageUrl(
  id: string,
  opts: ReceiptImageCacheDeps & {
    hasRemoteImage?: boolean;
    pendingUpload?: boolean;
  } = {},
): void {
  if (!isPersistedReceiptId(id)) return;
  if (
    !canFetchRemoteReceiptImage({
      hasRemoteImage: opts.hasRemoteImage,
      pendingUpload: opts.pendingUpload,
    })
  ) {
    return;
  }
  if (peekCachedReceiptImageUrl(id)) return;
  if (inflight.has(id)) return;
  void fetchReceiptImageUrlCached(id, opts).catch(() => {});
}
