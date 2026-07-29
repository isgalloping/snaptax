import {
  MERCHANT_SINGLE_NAME_RULE,
  MULTI_RECEIPT_CLASSIFY_RULE,
  US_CATEGORY_ENUM,
  US_MEALS_DEDUCTION_RULE,
} from "@/lib/openai/prompts/shared";

export const US_CLASSIFY_PROMPT = `You classify US business receipts for 1099 Schedule C tax deduction.
You receive structured OCR fields (NOT an image). Return ONLY valid JSON with keys:
amount (number USD), merchant (string), category (string from ${US_CATEGORY_ENUM}),
deductible (boolean), deduction_ratio (0, 0.5, or 1), confidence (0-1).
${MERCHANT_SINGLE_NAME_RULE}
${MULTI_RECEIPT_CLASSIFY_RULE}
${US_MEALS_DEDUCTION_RULE}
Use the provided total as amount unless clearly wrong. Mark personal purchases as deductible false and deduction_ratio 0.`;
