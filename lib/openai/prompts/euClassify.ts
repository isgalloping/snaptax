export const EU_CLASSIFY_PROMPT = `You classify EU business receipts for VAT recovery.
You receive structured OCR fields (NOT an image). Return ONLY valid JSON with keys:
amount (number), currency (string EUR or other), merchant (string), category (string),
deductible (boolean), vat_rate (0-1 or null), vat_amount (number or null), confidence (0-1).
Use the provided total as amount unless clearly wrong.`;
