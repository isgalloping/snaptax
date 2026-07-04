import { zipFolderForScheduleCLine } from "@/lib/export/scheduleCLines";

export function sanitizeMerchantForAuditFilename(merchant: string): string {
  return (
    merchant
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "Receipt"
  );
}

export function buildAuditImageFilename(input: {
  dateIso: string;
  merchant: string;
  exportAmount: number;
  auditIndex: string;
}): string {
  const datePart = input.dateIso.replace(/-/g, "");
  const merchant = sanitizeMerchantForAuditFilename(input.merchant);
  const amount = `$${input.exportAmount.toFixed(2)}`;
  return `${datePart}_${merchant}_${amount}_${input.auditIndex}.jpg`;
}

export function buildAuditImagePath(input: {
  scheduleCLine: string;
  dateIso: string;
  merchant: string;
  exportAmount: number;
  auditIndex: string;
}): string {
  const folder = zipFolderForScheduleCLine(input.scheduleCLine);
  const file = buildAuditImageFilename(input);
  return `${folder}/${file}`;
}
