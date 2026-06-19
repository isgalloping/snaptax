import OpenAI from "openai";
import { US_1099_PROMPT } from "@/lib/openai/prompts/us1099";
import { Us1099AiSchema } from "@/lib/openai/schemas1099";
import { prepareVisionImage } from "@/lib/receipts/prepareVisionImage";
import type { VisionProcessResult } from "@/lib/openai/receiptVision";
import { visionConfidenceTier } from "@/lib/openai/receiptVision";
import {
  getOpenAiApiKey,
  getOpenAiBaseUrl,
  getOpenAiModel,
  getOpenAiMaxRetries,
  getOpenAiTimeoutMs,
} from "@/lib/server/env";

function openaiClient(): OpenAI {
  const key = getOpenAiApiKey();
  if (!key) throw new Error("OPENAI_API_KEY missing");
  const baseURL = getOpenAiBaseUrl();
  return new OpenAI({
    apiKey: key,
    timeout: getOpenAiTimeoutMs(),
    maxRetries: getOpenAiMaxRetries(),
    ...(baseURL ? { baseURL } : {}),
  });
}

export async function process1099Vision(
  imageBuffer: Buffer,
  mime: "image/jpeg" | "image/png",
): Promise<VisionProcessResult> {
  const model = getOpenAiModel();
  const prepared = await prepareVisionImage(imageBuffer, mime);
  const client = openaiClient();
  const b64 = prepared.buffer.toString("base64");
  const dataUrl = `data:${prepared.mime};base64,${b64}`;

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: US_1099_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract 1099 income form fields from this image." },
          {
            type: "image_url",
            image_url: { url: dataUrl, detail: "low" },
          },
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
    return blurry1099Fallback(model, { parseError: true });
  }

  const fields = Us1099AiSchema.safeParse(parsed);
  if (!fields.success) return blurry1099Fallback(model, { zod: true });

  const f = fields.data;
  const tier = visionConfidenceTier(f.confidence, f.amount);
  if (tier === "action") {
    return blurry1099Fallback(model, { lowConfidence: true, fields: f });
  }

  return {
    fields: {
      amount: f.amount,
      merchant: f.payer,
      category: f.form_type,
      deductible: true,
      deduction_ratio: 1,
      confidence: f.confidence,
    },
    taxAmount: 0,
    status: "done",
    merchantName: f.payer,
    category: f.form_type,
    amount: f.amount,
    currency: "USD",
    deductible: false,
    aiRaw: {
      region: "us",
      document_kind: f.form_type,
      payer: f.payer,
      tax_year: f.tax_year ?? null,
      model,
    },
  };
}

function blurry1099Fallback(
  model: string,
  meta: Record<string, unknown>,
): VisionProcessResult {
  return {
    fields: {
      amount: 0,
      merchant: "",
      category: "1099-NEC",
      deductible: false,
      deduction_ratio: 0,
      confidence: 0,
    },
    taxAmount: 0,
    status: "blurry",
    merchantName: "",
    category: "1099-NEC",
    amount: null,
    currency: "USD",
    deductible: false,
    aiRaw: { region: "us", document_kind: "1099-NEC", model, ...meta },
  };
}
