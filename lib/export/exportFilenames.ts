import { LEGAL_BRAND_NAME } from "@/lib/legal/operator";

export type ExportFormat =
  | "csv"
  | "cpa_pack"
  | "cpa_pdf"
  | "txf"
  | "qif"
  | "qbo"
  | "xlsx";

/** Download filename for `POST /api/export/tax-pack` by format. */
export function exportTaxPackFilename(
  format: ExportFormat,
  taxYear: string | number,
): string {
  const year = String(taxYear);
  switch (format) {
    case "csv":
      return `${LEGAL_BRAND_NAME}-${year}-TurboTax-Expenses.csv`;
    case "cpa_pack":
      return `${LEGAL_BRAND_NAME}-${year}-Audit-Trail.zip`;
    case "cpa_pdf":
      return `${LEGAL_BRAND_NAME}-${year}-Schedule-C-Mirror.pdf`;
    case "txf":
      return `${LEGAL_BRAND_NAME}-${year}-Expenses.txf`;
    case "qif":
      return `${LEGAL_BRAND_NAME}-${year}-QuickBooks.qif`;
    case "qbo":
      return `${LEGAL_BRAND_NAME}-${year}-QuickBooks-Online.qbo`;
    case "xlsx":
      return `${LEGAL_BRAND_NAME}-${year}-Tax-Pack.xlsx`;
  }
}

export function exportPreviewCsvFilename(taxYear: string | number): string {
  return `${LEGAL_BRAND_NAME}-${String(taxYear)}-TurboTax-Preview.csv`;
}

export function sampleTurboTaxCsvFilename(taxYear: string | number): string {
  return `${LEGAL_BRAND_NAME}-SAMPLE-TurboTax-${String(taxYear)}.csv`;
}

export function exportShareTitle(
  taxYear: string | number,
  suffix?: string,
): string {
  const base = `${LEGAL_BRAND_NAME} ${String(taxYear)}`;
  return suffix ? `${base} ${suffix}` : base;
}
