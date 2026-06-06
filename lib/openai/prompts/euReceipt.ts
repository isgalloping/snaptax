export const EU_RECEIPT_PROMPT = `You analyze EU business receipt images for self-employed VAT recovery.
Return ONLY valid JSON with keys: amount (number gross total), currency (string e.g. EUR), merchant (string), category (string), deductible (boolean — strict, personal=false), vat_rate (number like 0.19 or null), vat_amount (number or null), confidence (0-1).
Extract VAT rate and VAT amount from the receipt when visible.`;
