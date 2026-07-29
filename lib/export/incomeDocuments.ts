import { formatIsoDate } from "@/lib/format";
import type { SnaptaxReceipt } from "@prisma/client";

export const INCOME_FORM_TYPES = ["1099-NEC", "1099-K"] as const;
export type IncomeFormType = (typeof INCOME_FORM_TYPES)[number];

export function isIncomeFormType(value: string | null | undefined): value is IncomeFormType {
  if (!value) return false;
  return INCOME_FORM_TYPES.includes(value.toUpperCase() as IncomeFormType);
}

export function incomeFormTypeFromReceipt(receipt: {
  category?: string | null;
  aiRaw?: SnaptaxReceipt["aiRaw"];
}): IncomeFormType | null {
  const category = receipt.category?.toUpperCase().trim();
  if (isIncomeFormType(category)) return category as IncomeFormType;

  if (!receipt.aiRaw || typeof receipt.aiRaw !== "object" || Array.isArray(receipt.aiRaw)) {
    return null;
  }
  const kind = (receipt.aiRaw as Record<string, unknown>).document_kind;
  if (typeof kind === "string" && isIncomeFormType(kind)) {
    return kind.toUpperCase() as IncomeFormType;
  }
  return null;
}

export function isIncomeDocument(receipt: {
  category?: string | null;
  aiRaw?: SnaptaxReceipt["aiRaw"];
}): boolean {
  return incomeFormTypeFromReceipt(receipt) != null;
}

export function sanitizePayerForFilename(payer: string): string {
  return (
    payer
      .replace(/[^a-zA-Z0-9]+/g, "")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "Payer"
  );
}

function sanitizeReceiptIdForFilename(receiptId: string): string {
  return receiptId.replace(/[^a-zA-Z0-9]+/g, "") || "Receipt";
}

/** `01_Income_Documents/1099_NEC_{Payer}_{YYYYMMDD}_{ReceiptId}.jpg` */
export function buildIncomeArchivePath(input: {
  formType: IncomeFormType;
  payer: string;
  dateIso: string;
  receiptId?: string;
}): string {
  const datePart = input.dateIso.replace(/-/g, "");
  const payer = sanitizePayerForFilename(input.payer);
  const formTag = input.formType.replace(/-/g, "_");
  const receiptPart = input.receiptId
    ? `_${sanitizeReceiptIdForFilename(input.receiptId)}`
    : "";
  return `01_Income_Documents/${formTag}_${payer}_${datePart}${receiptPart}.jpg`;
}

export type ExportIncomeRow = {
  id: string;
  dateIso: string;
  payer: string;
  amount: number;
  formType: IncomeFormType;
  taxYear: number | null;
  imagePathname: string | null;
  incomeArchivePath: string;
};

export function buildExportIncomeRow(
  receipt: SnaptaxReceipt,
  timeZone: string,
): ExportIncomeRow | null {
  const formType = incomeFormTypeFromReceipt(receipt);
  if (!formType) return null;

  const instant = receipt.snapAt ?? receipt.capturedAt;
  const dateIso = formatIsoDate(instant, timeZone);
  const payer =
    receipt.merchantName?.trim() ||
    extractPayerFromAiRaw(receipt.aiRaw) ||
    "Unknown_Payer";
  const amount = Number(receipt.amount ?? 0);

  return {
    id: receipt.id,
    dateIso,
    payer,
    amount,
    formType,
    taxYear: extractIncomeTaxYearFromAiRaw(receipt.aiRaw),
    imagePathname: receipt.imageUrl?.trim() || null,
    incomeArchivePath: buildIncomeArchivePath({
      formType,
      payer,
      dateIso,
      receiptId: receipt.id,
    }),
  };
}

function extractPayerFromAiRaw(aiRaw: SnaptaxReceipt["aiRaw"]): string | null {
  if (!aiRaw || typeof aiRaw !== "object" || Array.isArray(aiRaw)) return null;
  const payer = (aiRaw as Record<string, unknown>).payer;
  return typeof payer === "string" && payer.trim() ? payer.trim() : null;
}

/** Form tax year from Vision aiRaw (1099 box), not capture calendar year. */
export function extractIncomeTaxYearFromAiRaw(
  aiRaw: SnaptaxReceipt["aiRaw"] | undefined,
): number | null {
  if (!aiRaw || typeof aiRaw !== "object" || Array.isArray(aiRaw)) return null;
  const year = (aiRaw as Record<string, unknown>).tax_year;
  if (
    typeof year === "number" &&
    Number.isInteger(year) &&
    year >= 2000 &&
    year <= 2100
  ) {
    return year;
  }
  return null;
}

export function summarizeIncomeRows(rows: ExportIncomeRow[]): {
  totalGross: number;
  formCount: number;
  necTotal: number;
  kTotal: number;
} {
  let necTotal = 0;
  let kTotal = 0;
  for (const row of rows) {
    if (row.formType === "1099-NEC") necTotal += row.amount;
    else kTotal += row.amount;
  }
  return {
    totalGross: necTotal + kTotal,
    formCount: rows.length,
    necTotal,
    kTotal,
  };
}
