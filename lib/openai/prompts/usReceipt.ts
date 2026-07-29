import {
  MERCHANT_SINGLE_NAME_RULE,
  MULTI_RECEIPT_VISION_RULE,
  US_CATEGORY_ENUM,
  US_MEALS_DEDUCTION_RULE,
} from "@/lib/openai/prompts/shared";

export const US_RECEIPT_PROMPT = `You analyze US business receipt images for 1099 contractors.
Return ONLY valid JSON with keys: amount (number USD), merchant (string), category (string from ${US_CATEGORY_ENUM}), deductible (boolean), deduction_ratio (0, 0.5, or 1), confidence (0-1).
${MERCHANT_SINGLE_NAME_RULE}
${MULTI_RECEIPT_VISION_RULE}
${US_MEALS_DEDUCTION_RULE}
Mark personal/non-business purchases as deductible false and deduction_ratio 0.`;
