import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { processReceiptTax } from "@/lib/receipts/processReceiptTax";
import {
  assertValidReceiptImage,
  mimeForKind,
} from "@/lib/receipts/uploadValidation";
import { blobCommandOptions } from "@/lib/server/blob";
import { logEvent } from "@/lib/server/log/logEvent";
import type { TaxRegion } from "@/lib/tax/types";

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

export async function enqueueTaxRecalc(params: {
  userId: string;
  lockedRegion: TaxRegion;
  industry?: string | null;
}): Promise<number> {
  const receipts = await prisma.snaptaxReceipt.findMany({
    where: {
      userId: params.userId,
      status: { in: ["done", "processing"] },
    },
    select: { id: true, imageUrl: true, status: true },
  });

  if (receipts.length === 0) return 0;

  void recalcReceiptsInBackground(receipts, params.lockedRegion, params.industry);
  return receipts.length;
}

async function recalcReceiptsInBackground(
  receipts: Array<{ id: string; imageUrl: string; status: string }>,
  lockedRegion: TaxRegion,
  industry?: string | null,
) {
  for (const receipt of receipts) {
    try {
      await prisma.snaptaxReceipt.update({
        where: { id: receipt.id },
        data: { status: "processing", taxAmount: 0 },
      });

      const blobResult = await get(receipt.imageUrl, {
        access: "private",
        ...blobCommandOptions(),
      });
      if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
        continue;
      }
      const bytes = Buffer.from(
        await new Response(blobResult.stream).arrayBuffer(),
      );
      const kind = assertValidReceiptImage(bytes);
      const mime = mimeForKind(kind);

      await processReceiptTax({
        receiptId: receipt.id,
        dataRegion: lockedRegion,
        imageBuffer: bytes,
        mime,
        industry,
      });
    } catch (err) {
      logEvent({
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
