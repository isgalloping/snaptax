import {
  MERCHANT_SINGLE_NAME_RULE,
  MULTI_RECEIPT_VISION_RULE,
  US_CATEGORY_ENUM,
} from "@/lib/openai/prompts/shared";

export const EU_RECEIPT_PROMPT = `You analyze EU business receipt images for self-employed VAT recovery.
Return ONLY valid JSON with keys: amount (number gross total), currency (string e.g. EUR), merchant (string), category (string from ${US_CATEGORY_ENUM}), deductible (boolean — strict, personal=false), vat_rate (number like 0.19 or null), vat_amount (number or null), confidence (0-1).
${MERCHANT_SINGLE_NAME_RULE}
${MULTI_RECEIPT_VISION_RULE}
Extract VAT rate and VAT amount from the receipt when visible. Mark personal/non-business purchases as deductible false.`;
