export const US_CLASSIFY_PROMPT = `You classify US business receipts for 1099 Schedule C tax deduction.
You receive structured OCR fields (NOT an image). Return ONLY valid JSON with keys:
amount (number USD), merchant (string), category (string from TRUCK GAS, TOOLS, SUPPLIES, EQUIPMENT, MATERIALS, MEALS, PERSONAL, OTHER),
deductible (boolean), deduction_ratio (0, 0.5, or 1), confidence (0-1).
Use the provided total as amount unless clearly wrong. Mark personal purchases as deductible false and deduction_ratio 0.`;

export const EU_CLASSIFY_PROMPT = `You classify EU business receipts for VAT recovery.
You receive structured OCR fields (NOT an image). Return ONLY valid JSON with keys:
amount (number), currency (string EUR or other), merchant (string), category (string),
deductible (boolean), vat_rate (0-1 or null), vat_amount (number or null), confidence (0-1).
Use the provided total as amount unless clearly wrong.`;
