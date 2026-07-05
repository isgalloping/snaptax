export const RECEIPT_SUMMARY_SCHEMA_VERSION = 2 as const;
export const RECEIPT_SUMMARY_WATERMARK_KEY = "receipt_summary_watermark" as const;
export const RECEIPT_SUMMARY_BOOTSTRAP_KEY = "receipt_summary_bootstrap" as const;

export type ReceiptSeasonSummary = {
  scopeKey: string;
  taxYear: number;
  totalTaxSaved: number;
  totalReceiptCount: number;
  totalDeductions: number;
  incomeFormCount: number;
  totalIncomeGross: number;
  byCategory?: Record<string, { deductions: number; count: number }>;
  byQuarter?: Record<1 | 2 | 3 | 4, { totalTaxSaved: number; totalReceiptCount: number }>;
  lastUpdatedMs: number;
};

export type ReceiptSummaryWatermark = {
  maxUpdatedAtMs: number;
  receiptCountInCurrentSeason: number;
  schemaVersion: typeof RECEIPT_SUMMARY_SCHEMA_VERSION;
};
