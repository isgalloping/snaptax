export const US_RECEIPT_PROMPT = `You analyze US business receipt images for 1099 contractors.
Return ONLY valid JSON with keys: amount (number USD), merchant (string), category (string from TRUCK GAS, TOOLS, SUPPLIES, EQUIPMENT, MATERIALS, MEALS, PERSONAL, OTHER), deductible (boolean), deduction_ratio (0, 0.5, or 1), confidence (0-1).
Mark personal/non-business purchases as deductible false and deduction_ratio 0.`;
