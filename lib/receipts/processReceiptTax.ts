import { prisma } from "@/lib/prisma";
import { process1099Vision } from "@/lib/openai/process1099Vision";
import type { OcrDraftPayload } from "@/lib/ocr/types";
import {
  routeStandardReceiptTax,
} from "@/lib/receipts/processReceiptTaxRouter";
import { baseLogEntry } from "@/lib/server/log/context";
import { logEvent } from "@/lib/server/log/logEvent";
import type { TaxRegion } from "@/lib/tax/types";
import { utcNow } from "@/lib/time/utc";
import { mockReceiptVision } from "@/lib/verify/mockReceiptVision";
import { mock1099Vision } from "@/lib/verify/mock1099Vision";
import type { Prisma } from "@prisma/client";
import type { Actor } from "@/lib/auth/getActor";

export async function processReceiptTax(params: {
  receiptId: string;
  dataRegion: TaxRegion;
  imageBuffer: Buffer;
  mime: "image/jpeg" | "image/png";
  industry?: string | null;
  ocrDraft?: OcrDraftPayload | null;
  canMockAi?: boolean;
  captureKind?: "1099-NEC" | "1099-K" | null;
  logContext?: {
    request: Request;
    actor: Actor;
  };
}) {
  const started = Date.now();

  const { result, route } =
    params.captureKind && params.dataRegion === "us"
      ? {
          result: params.canMockAi
            ? mock1099Vision(params.captureKind)
            : await process1099Vision(params.imageBuffer, params.mime),
          route: "vision_fallback" as const,
        }
      : params.canMockAi
        ? {
            result: (() => {
              const mock = mockReceiptVision(params.dataRegion);
              return {
                ...mock,
                aiRaw: {
                  ...mock.aiRaw,
                  extractionSource: "vision_fallback",
                },
              };
            })(),
            route: "vision_fallback" as const,
          }
        : await routeStandardReceiptTax({
            dataRegion: params.dataRegion,
            imageBuffer: params.imageBuffer,
            mime: params.mime,
            industry: params.industry,
            ocrDraft: params.ocrDraft,
            canMockAi: params.canMockAi,
          });

  if (params.logContext) {
    logEvent({
      ...baseLogEntry("biz.ocr", params.logContext.request, params.logContext.actor),
      level: result.status === "done" ? "info" : "warn",
      success: result.status === "done",
      durationMs: Date.now() - started,
      meta: {
        stage:
          route === "text_classify" ? "text_classify" : "vision_fallback",
        receiptId: params.receiptId,
        extractionSource:
          (result.aiRaw.extractionSource as string | undefined) ??
          "vision_fallback",
        engine: params.ocrDraft?.engine,
        status: result.status,
        dataRegion: params.dataRegion,
      },
    });
  }

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
