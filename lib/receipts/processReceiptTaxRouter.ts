import { classifyReceiptText } from "@/lib/openai/classifyReceiptText";
import {
  actionThreshold,
  processReceiptVision,
  visionConfidenceTier,
  type VisionProcessResult,
} from "@/lib/openai/receiptVision";
import type { OcrDraftPayload, StructuredReceipt } from "@/lib/ocr/types";
import { shouldUseVisionFallback } from "@/lib/ocr/qualityGate";
import { summarizeOcrDraftForAiRaw } from "@/lib/ocr/ocrDraftSchema";
import { computeTaxAmount } from "@/lib/tax/computeTaxAmount";
import { computeEuVatAmount } from "@/lib/tax/computeEu";
import { usDeductibleBase } from "@/lib/tax/computeUs";
import { usMarginalRate } from "@/lib/tax/usCategories";
import type { TaxRegion } from "@/lib/tax/types";
import { getOpenAiClassifyModel } from "@/lib/server/env";

export type ReceiptTaxRoute = "text_classify" | "vision_fallback";

export function ocrDraftToStructured(draft: OcrDraftPayload): StructuredReceipt {
  const merchant =
    draft.parsed.merchant?.trim() ||
    draft.text.split(/\r?\n/).find((l) => l.trim())?.trim() ||
    "Unknown";
  const total = draft.parsed.total ?? 0;
  return {
    merchant,
    date: draft.parsed.date,
    total,
    tax: draft.parsed.tax,
    rawText: draft.parsed.rawText || draft.text,
    extractionSource: "local_ocr",
  };
}

export function pickReceiptTaxRoute(
  ocrDraft: OcrDraftPayload | null | undefined,
  canMockAi?: boolean,
): ReceiptTaxRoute {
  if (canMockAi) return "vision_fallback";
  if (shouldUseVisionFallback(ocrDraft)) return "vision_fallback";
  return "text_classify";
}

function blurryFromTextClassify(
  region: TaxRegion,
  model: string,
  meta: Record<string, unknown>,
): VisionProcessResult {
  return {
    fields: {
      amount: 0,
      merchant: "",
      category: "OTHER",
      deductible: false,
      deduction_ratio: 0,
      confidence: 0,
    },
    taxAmount: 0,
    status: "blurry",
    merchantName: "",
    category: "OTHER",
    amount: null,
    currency: region === "eu" ? "EUR" : "USD",
    deductible: false,
    aiRaw: {
      region,
      model,
      extractionSource: "local_ocr",
      ...meta,
    },
  };
}

export function buildTextClassifyResult(params: {
  classified: Awaited<ReturnType<typeof classifyReceiptText>>;
  dataRegion: TaxRegion;
  model: string;
  ocrDraft: OcrDraftPayload;
  structured: StructuredReceipt;
}): VisionProcessResult {
  if (params.classified.region === "eu") {
    const f = params.classified.fields;
    const tier = visionConfidenceTier(f.confidence, f.amount);
    if (tier === "action") {
      return blurryFromTextClassify(params.dataRegion, params.model, {
        lowConfidence: true,
        fields: f,
      });
    }
    const computedVat = computeEuVatAmount(f);
    const taxAmount = computeTaxAmount("eu", f);
    return {
      fields: f,
      taxAmount,
      status: "done",
      merchantName: f.merchant,
      category: f.category.toUpperCase(),
      amount: f.amount,
      currency: f.currency,
      deductible: f.deductible,
      aiRaw: {
        region: "eu",
        vat_rate: f.vat_rate,
        vat_amount: f.vat_amount,
        computed_vat: f.vat_amount == null && computedVat != null,
        model: params.model,
        classificationModel: params.model,
        extractionSource: "local_ocr",
        ocrDraft: summarizeOcrDraftForAiRaw(params.ocrDraft),
        rawText: params.structured.rawText.slice(0, 2000),
      },
    };
  }

  const f = params.classified.fields;
  const tier = visionConfidenceTier(f.confidence, f.amount);
  if (tier === "action") {
    return blurryFromTextClassify(params.dataRegion, params.model, {
      lowConfidence: true,
      fields: f,
    });
  }
  const taxAmount = computeTaxAmount("us", f);
  return {
    fields: f,
    taxAmount,
    status: "done",
    merchantName: f.merchant,
    category: f.category.toUpperCase(),
    amount: f.amount,
    currency: "USD",
    deductible: f.deductible,
    aiRaw: {
      region: "us",
      deduction_ratio: f.deduction_ratio,
      marginal_rate: usMarginalRate(),
      deductible_base: usDeductibleBase(f),
      model: params.model,
      classificationModel: params.model,
      extractionSource: "local_ocr",
      ocrDraft: summarizeOcrDraftForAiRaw(params.ocrDraft),
      rawText: params.structured.rawText.slice(0, 2000),
    },
  };
}

export async function runTextClassifyPath(params: {
  ocrDraft: OcrDraftPayload;
  dataRegion: TaxRegion;
  industry?: string | null;
}): Promise<VisionProcessResult> {
  const structured = ocrDraftToStructured(params.ocrDraft);
  const model = getOpenAiClassifyModel();
  const classified = await classifyReceiptText({
    structured,
    dataRegion: params.dataRegion,
    industry: params.industry,
  });

  return buildTextClassifyResult({
    classified,
    dataRegion: params.dataRegion,
    model,
    ocrDraft: params.ocrDraft,
    structured,
  });
}

export async function runVisionPath(params: {
  imageBuffer: Buffer;
  mime: "image/jpeg" | "image/png";
  dataRegion: TaxRegion;
  industry?: string | null;
  ocrDraft?: OcrDraftPayload | null;
}): Promise<VisionProcessResult> {
  const result = await processReceiptVision(
    params.imageBuffer,
    params.mime,
    params.dataRegion,
    params.industry,
  );
  return {
    ...result,
    aiRaw: {
      ...result.aiRaw,
      extractionSource: "vision_fallback",
      ...(params.ocrDraft
        ? { ocrDraft: summarizeOcrDraftForAiRaw(params.ocrDraft) }
        : {}),
    },
  };
}

export async function routeStandardReceiptTax(params: {
  dataRegion: TaxRegion;
  imageBuffer: Buffer;
  mime: "image/jpeg" | "image/png";
  industry?: string | null;
  ocrDraft?: OcrDraftPayload | null;
  canMockAi?: boolean;
}): Promise<{ result: VisionProcessResult; route: ReceiptTaxRoute }> {
  const route = pickReceiptTaxRoute(params.ocrDraft, params.canMockAi);
  if (route === "text_classify" && params.ocrDraft) {
    try {
      const result = await runTextClassifyPath({
        ocrDraft: params.ocrDraft,
        dataRegion: params.dataRegion,
        industry: params.industry,
      });
      return { result, route: "text_classify" };
    } catch {
      // classify failure → vision fallback
    }
  }

  const result = await runVisionPath({
    imageBuffer: params.imageBuffer,
    mime: params.mime,
    dataRegion: params.dataRegion,
    industry: params.industry,
    ocrDraft: params.ocrDraft,
  });
  return { result, route: "vision_fallback" };
}

export { actionThreshold, visionConfidenceTier };
