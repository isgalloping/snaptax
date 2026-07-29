/**
 * Collapse AI/OCR merchant labels to a single store name.
 * Vision sometimes joins multiple header lines with " / " on one receipt.
 */
export function normalizeMerchantName(raw: string | null | undefined): string {
  if (!raw) return "";
  let merchant = raw.trim();
  if (!merchant) return "";

  const slashParts = merchant.split(/\s+[\/|]\s+/);
  if (slashParts.length > 1) {
    merchant = slashParts[0]!.trim();
  }

  merchant = merchant.replace(/\s*\([A-Z0-9]{2,8}\)\s*$/i, "").trim();

  return merchant.slice(0, 120);
}
