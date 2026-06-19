import { prisma } from "@/lib/prisma";
import { processReceiptVision } from "@/lib/openai/receiptVision";
import { process1099Vision } from "@/lib/openai/process1099Vision";
import type { TaxRegion } from "@/lib/tax/types";
import { utcNow } from "@/lib/time/utc";
import { mockReceiptVision } from "@/lib/verify/mockReceiptVision";
import { mock1099Vision } from "@/lib/verify/mock1099Vision";
import type { Prisma } from "@prisma/client";

export async function processReceiptTax(params: {
  receiptId: string;
  dataRegion: TaxRegion;
  imageBuffer: Buffer;
  mime: "image/jpeg" | "image/png";
  industry?: string | null;
  canMockAi?: boolean;
  captureKind?: "1099-NEC" | "1099-K" | null;
}) {
  const result =
    params.captureKind && params.dataRegion === "us"
      ? params.canMockAi
        ? mock1099Vision(params.captureKind)
        : await process1099Vision(params.imageBuffer, params.mime)
      : params.canMockAi
        ? mockReceiptVision(params.dataRegion)
        : await processReceiptVision(
            params.imageBuffer,
            params.mime,
            params.dataRegion,
            params.industry,
          );

  await prisma.snaptaxReceipt.update({
    where: { id: params.receiptId },
    data: {
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      merchantName: result.merchantName || null,
      category: result.category || null,
      deductible: result.deductible,
      taxAmount: result.taxAmount,
      aiConfidence: result.fields.confidence,
      dataRegion: params.dataRegion,
      aiRaw: result.aiRaw as Prisma.InputJsonValue,
      processedAt: result.status === "done" ? utcNow() : null,
    },
  });

  return result;
}
