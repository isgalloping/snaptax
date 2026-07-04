import { categoryExportMapping } from "@/lib/export/mapping/exportCategoryMapping";

export function sanitizeMerchantForFilename(merchant: string): string {
  return (
    merchant
      .replace(/[^a-zA-Z0-9]+/g, "")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "Receipt"
  );
}

/** `REC_{YYYYMMDD}_{Merchant}_{Amount}.jpg` per export-biz.md */
export function buildReceiptAlias(input: {
  dateIso: string;
  merchant: string;
  amount: number;
  suffix?: string;
}): string {
  const datePart = input.dateIso.replace(/-/g, "");
  const merchant = sanitizeMerchantForFilename(input.merchant);
  const amount = input.amount.toFixed(2);
  const base = `REC_${datePart}_${merchant}_${amount}.jpg`;
  if (!input.suffix) return base;
  return base.replace(/\.jpg$/, `_${input.suffix}.jpg`);
}

export function buildReceiptArchivePath(input: {
  category: string;
  dateIso: string;
  merchant: string;
  amount: number;
  suffix?: string;
}): string {
  const mapping = categoryExportMapping(input.category);
  if (!mapping.zipFolderName) return "";
  const alias = buildReceiptAlias(input);
  return `${mapping.zipFolderName}/${alias}`;
}
