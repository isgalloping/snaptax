import {
  MERCHANT_SINGLE_NAME_RULE,
  MULTI_RECEIPT_CLASSIFY_RULE,
  US_CATEGORY_ENUM,
} from "@/lib/openai/prompts/shared";

export const EU_CLASSIFY_PROMPT = `You classify EU business receipts for VAT recovery.
You receive structured OCR fields (NOT an image). Return ONLY valid JSON with keys:
amount (number), currency (string EUR or other), merchant (string), category (string from ${US_CATEGORY_ENUM}),
deductible (boolean), vat_rate (0-1 or null), vat_amount (number or null), confidence (0-1).
${MERCHANT_SINGLE_NAME_RULE}
${MULTI_RECEIPT_CLASSIFY_RULE}
Use the provided total as amount unless clearly wrong. Mark personal/non-business purchases as deductible false.`;
