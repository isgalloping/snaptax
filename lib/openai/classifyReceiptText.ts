import OpenAI from "openai";
import { z } from "zod";
import { EU_CLASSIFY_PROMPT } from "@/lib/openai/prompts/euClassify";
import { US_CLASSIFY_PROMPT } from "@/lib/openai/prompts/usClassify";
import { EuReceiptAiSchema, UsReceiptAiSchema } from "@/lib/openai/schemas";
import type { StructuredReceipt } from "@/lib/ocr/types";
import type { TaxRegion } from "@/lib/tax/types";
import {
  getOpenAiApiKey,
  getOpenAiBaseUrl,
  getOpenAiClassifyModel,
  getOpenAiMaxRetries,
  getOpenAiTimeoutMs,
} from "@/lib/server/env";
import {
  industryLabelForPrompt,
  type ValidIndustry,
} from "@/lib/users/industrySchema";

function openaiClient(): OpenAI {
  const key = getOpenAiApiKey();
  if (!key) throw new Error("OPENAI_API_KEY missing");
  const baseURL = getOpenAiBaseUrl();
  return new OpenAI({
    apiKey: key,
    ...(baseURL ? { baseURL } : {}),
    timeout: getOpenAiTimeoutMs(),
    maxRetries: getOpenAiMaxRetries(),
  });
}

function isValidIndustry(value: string): value is ValidIndustry {
  return (
    value === "truck_driver" ||
    value === "plumber" ||
    value === "electrician" ||
    value === "construction" ||
    value === "delivery" ||
    value === "general"
  );
}

export async function classifyReceiptText(params: {
  structured: StructuredReceipt;
  dataRegion: TaxRegion;
  industry?: string | null;
}): Promise<
  | { region: "us"; fields: z.infer<typeof UsReceiptAiSchema> }
  | { region: "eu"; fields: z.infer<typeof EuReceiptAiSchema> }
> {
  const model = getOpenAiClassifyModel();
  const industryHint =
    params.industry && isValidIndustry(params.industry)
      ? `User industry context: ${industryLabelForPrompt(params.industry)}.`
      : "";

  const userPayload = {
    data_region: params.dataRegion,
    merchant: params.structured.merchant,
    total: params.structured.total,
    tax: params.structured.tax,
    date: params.structured.date,
    raw_text: params.structured.rawText.slice(0, 4000),
  };

  const systemPrompt =
    params.dataRegion === "eu" ? EU_CLASSIFY_PROMPT : US_CLASSIFY_PROMPT;

  const client = openaiClient();
  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${systemPrompt}\n${industryHint}` },
      {
        role: "user",
        content: `Classify this receipt:\n${JSON.stringify(userPayload)}`,
      },
    ],
  });

  const rawText = completion.choices[0]?.message?.content;
  if (!rawText) throw new Error("OPENAI_EMPTY");

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("OPENAI_PARSE");
  }

  if (params.dataRegion === "eu") {
    const fields = EuReceiptAiSchema.safeParse(parsed);
    if (!fields.success) throw new Error("OPENAI_ZOD");
    return { region: "eu", fields: fields.data };
  }

  const fields = UsReceiptAiSchema.safeParse(parsed);
  if (!fields.success) throw new Error("OPENAI_ZOD");
  return { region: "us", fields: fields.data };
}
