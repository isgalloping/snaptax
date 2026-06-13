import { prisma } from "@/lib/prisma";
import { processReceiptVision } from "@/lib/openai/receiptVision";
import type { TaxRegion } from "@/lib/tax/types";
import { utcNow } from "@/lib/time/utc";
import { mockReceiptVision } from "@/lib/verify/mockReceiptVision";
import type { Prisma } from "@prisma/client";

export async function processReceiptTax(params: {
  receiptId: string;
  dataRegion: TaxRegion;
  imageBuffer: Buffer;
  mime: "image/jpeg" | "image/png";
  industry?: string | null;
  canMockAi?: boolean;
}) {
  const result = params.canMockAi
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
      dataRegion: params.dataRegion,
      aiRaw: result.aiRaw as Prisma.InputJsonValue,
      processedAt: result.status === "done" ? utcNow() : null,
    },
  });

  return result;
}
