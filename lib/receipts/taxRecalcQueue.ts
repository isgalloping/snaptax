import type { Prisma } from "@prisma/client";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { unfiledReceiptWhere } from "@/lib/receipts/filedStatus";
import { processReceiptTax } from "@/lib/receipts/processReceiptTax";
import {
  assertValidReceiptImage,
  mimeForKind,
} from "@/lib/receipts/uploadValidation";
import { blobCommandOptions } from "@/lib/server/blob";
import { logEvent } from "@/lib/server/log/logEvent";
import type { LogEntry } from "@/lib/server/log/types";
import type { TaxRegion } from "@/lib/tax/types";

type RecalcBlobResult = {
  statusCode?: number | null;
  stream?: ReadableStream<Uint8Array> | null;
};

type ResetReceiptForRecalc = (receiptId: string) => Promise<{ count: number }>;

export type RecalcReceiptsInBackgroundDeps = {
  getBlob?: (pathname: string) => Promise<RecalcBlobResult | null>;
  resetReceiptForRecalc?: ResetReceiptForRecalc;
  processReceipt?: typeof processReceiptTax;
  log?: (entry: LogEntry) => void;
};

export async function resolveGhostCandidate(
  ghostId: string,
  headerRegion: TaxRegion,
): Promise<TaxRegion> {
  const receipts = await prisma.snaptaxReceipt.findMany({
    where: { ghostId, userId: null },
    select: { dataRegion: true },
  });
  if (receipts.length === 0) return headerRegion;

  const counts = new Map<TaxRegion, number>();
  for (const r of receipts) {
    const region = r.dataRegion as TaxRegion;
    counts.set(region, (counts.get(region) ?? 0) + 1);
  }
  let mode: TaxRegion = headerRegion;
  let max = -1;
  for (const [region, count] of counts) {
    if (count > max) {
      max = count;
      mode = region;
    }
  }
  if (mode !== headerRegion) {
    logEvent({
      ts: new Date().toISOString(),
      level: "warn",
      module: "biz.openai",
      success: true,
      durationMs: 0,
      meta: {
        reason: "receipt_mode_mismatch",
        dataRegion: mode,
      },
    });
  }
  return mode;
}

/** Receipts eligible for post-login region recalc (excludes filed). */
export function taxRecalcReceiptWhere(
  userId: string,
): Prisma.SnaptaxReceiptWhereInput {
  return {
    userId,
    status: { in: ["done", "processing"] },
    ...unfiledReceiptWhere(),
  };
}

export async function enqueueTaxRecalc(params: {
  userId: string;
  lockedRegion: TaxRegion;
  industry?: string | null;
}): Promise<number> {
  const receipts = await prisma.snaptaxReceipt.findMany({
    where: taxRecalcReceiptWhere(params.userId),
    select: { id: true, imageUrl: true, status: true },
  });

  if (receipts.length === 0) return 0;

  void recalcReceiptsInBackground(receipts, params.lockedRegion, params.industry);
  return receipts.length;
}

function getReceiptBlob(pathname: string) {
  return get(pathname, {
    access: "private",
    ...blobCommandOptions(),
  });
}

function resetReceiptForRecalc(receiptId: string) {
  return prisma.snaptaxReceipt.updateMany({
    where: { id: receiptId, ...unfiledReceiptWhere() },
    data: { status: "processing", taxAmount: 0 },
  });
}

export async function recalcReceiptsInBackground(
  receipts: Array<{ id: string; imageUrl: string; status: string }>,
  lockedRegion: TaxRegion,
  industry?: string | null,
  deps: RecalcReceiptsInBackgroundDeps = {},
) {
  const getBlob = deps.getBlob ?? getReceiptBlob;
  const resetReceipt = deps.resetReceiptForRecalc ?? resetReceiptForRecalc;
  const processReceipt = deps.processReceipt ?? processReceiptTax;
  const log = deps.log ?? logEvent;

  for (const receipt of receipts) {
    try {
      const blobResult = await getBlob(receipt.imageUrl);
      if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
        log({
          ts: new Date().toISOString(),
          level: "warn",
          module: "biz.openai",
          success: false,
          durationMs: 0,
          meta: {
            receiptId: receipt.id,
            reason: "recalc_blob_unreadable",
            errorMessage:
              blobResult?.statusCode != null
                ? `blob_status_${blobResult.statusCode}`
                : "blob_missing",
          },
        });
        continue;
      }

      const reset = await resetReceipt(receipt.id);
      if (reset.count === 0) continue;

      const bytes = Buffer.from(
        await new Response(blobResult.stream).arrayBuffer(),
      );
      const kind = assertValidReceiptImage(bytes);
      const mime = mimeForKind(kind);

      await processReceipt({
        receiptId: receipt.id,
        dataRegion: lockedRegion,
        imageBuffer: bytes,
        mime,
        industry,
      });
    } catch (err) {
      log({
        ts: new Date().toISOString(),
        level: "error",
        module: "biz.openai",
        success: false,
        durationMs: 0,
        meta: {
          receiptId: receipt.id,
          errorMessage: err instanceof Error ? err.message : "RECALC_FAILED",
        },
      });
    }
  }
}
