import OpenAI from "openai";
import { EU_RECEIPT_PROMPT, US_RECEIPT_PROMPT } from "@/lib/openai/prompts";
import { EuReceiptAiSchema, UsReceiptAiSchema } from "@/lib/openai/schemas";
import { computeTaxAmount } from "@/lib/tax/computeTaxAmount";
import { computeEuVatAmount } from "@/lib/tax/computeEu";
import { usDeductibleBase } from "@/lib/tax/computeUs";
import { usMarginalRate } from "@/lib/tax/usCategories";
import type { ReceiptAiFields, TaxRegion } from "@/lib/tax/types";

import { getOpenAiApiKey, getOpenAiModel } from "@/lib/server/env";

function openaiClient(): OpenAI {
  const key = getOpenAiApiKey();
  if (!key) throw new Error("OPENAI_API_KEY missing");
  return new OpenAI({ apiKey: key });
}

function confidenceThreshold(): number {
  return Number(process.env.RECEIPT_CONFIDENCE_THRESHOLD ?? 0.7);
}

export type VisionProcessResult = {
  fields: ReceiptAiFields;
  taxAmount: number;
  status: "done" | "blurry";
  aiRaw: Record<string, unknown>;
  merchantName: string;
  category: string;
  amount: number | null;
  currency: string | null;
  deductible: boolean;
};

export async function processReceiptVision(
  imageBuffer: Buffer,
  mime: "image/jpeg" | "image/png",
  dataRegion: TaxRegion,
  industry?: string | null,
): Promise<VisionProcessResult> {
  const model = getOpenAiModel();
  const systemPrompt =
    dataRegion === "eu" ? EU_RECEIPT_PROMPT : US_RECEIPT_PROMPT;
  const industryHint = industry
    ? `User industry context: ${industry}.`
    : "";

  const client = openaiClient();
  const b64 = imageBuffer.toString("base64");
  const dataUrl = `data:${mime};base64,${b64}`;

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${systemPrompt}\n${industryHint}` },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract receipt fields from this image." },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  const rawText = completion.choices[0]?.message?.content;
  if (!rawText) throw new Error("OPENAI_EMPTY");

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return blurryFallback(dataRegion, model, { parseError: true });
  }

  if (dataRegion === "eu") {
    const fields = EuReceiptAiSchema.safeParse(parsed);
    if (!fields.success) return blurryFallback(dataRegion, model, { zod: true });
    const f = fields.data;
    if (f.confidence < confidenceThreshold() || f.amount <= 0) {
      return blurryFallback(dataRegion, model, { lowConfidence: true, fields: f });
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
        vat_amount: computedVat,
        computed_vat: f.vat_amount == null && computedVat != null,
        model,
      },
    };
  }

  const fields = UsReceiptAiSchema.safeParse(parsed);
  if (!fields.success) return blurryFallback(dataRegion, model, { zod: true });
  const f = fields.data;
  if (f.confidence < confidenceThreshold() || f.amount <= 0) {
    return blurryFallback(dataRegion, model, { lowConfidence: true, fields: f });
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
      model,
    },
  };
}

function blurryFallback(
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
    } as ReceiptAiFields,
    taxAmount: 0,
    status: "blurry",
    merchantName: "",
    category: "OTHER",
    amount: null,
    currency: region === "eu" ? "EUR" : "USD",
    deductible: false,
    aiRaw: { region, model, ...meta },
  };
}
