import {
  canPurgePhotoFullForReceipt,
  shouldPurgePhotoFull,
} from "@/lib/client/photoRetention";
import { purgePhotoFull } from "@/lib/storage/crypto/photoStore";
import { listPhotoMetaForRetention } from "@/lib/storage/photoMetadata";
import { loadAllReceipts, warmReceiptDb } from "@/lib/storage/receiptDb";

export async function purgeExpiredPhotoFulls(nowMs = Date.now()): Promise<number> {
  const db = await warmReceiptDb();
  const metas = await listPhotoMetaForRetention(db);
  if (metas.length === 0) return 0;

  const receipts = await loadAllReceipts();
  const byId = new Map(receipts.map((r) => [r.id, r]));
  let purged = 0;

  for (const meta of metas) {
    if (!shouldPurgePhotoFull(meta, nowMs)) continue;
    if (!canPurgePhotoFullForReceipt(byId.get(meta.id))) continue;
    await purgePhotoFull(db, meta.id, nowMs);
    purged += 1;
  }

  return purged;
}

export function schedulePhotoRetentionPurge(delayMs = 30_000): void {
  if (typeof window === "undefined") return;

  const run = () => {
    void purgeExpiredPhotoFulls().catch(() => {
      // idle best-effort
    });
  };

  if ("requestIdleCallback" in window) {
    window.setTimeout(() => {
      window.requestIdleCallback(() => run(), { timeout: 60_000 });
    }, delayMs);
    return;
  }

  globalThis.setTimeout(run, delayMs);
}
