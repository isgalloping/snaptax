export const US_1099_PROMPT = `You analyze US IRS Form 1099 tax documents for self-employed contractors.
Return ONLY valid JSON with keys:
- form_type: "1099-NEC" or "1099-K"
- payer: string (payer / client name from the form)
- amount: number USD (Box 1 nonemployee compensation for 1099-NEC; Box 1a gross for 1099-K)
- tax_year: number (4-digit year on the form, or null if unclear)
- confidence: number 0-1
If the image is not a 1099 form, set confidence below 0.5 and use empty payer with amount 0.`;
