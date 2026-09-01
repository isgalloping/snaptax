import type { IncomeFormType } from "@/lib/export/incomeDocuments";
import type { TaxRegion } from "@/lib/tax/types";

export type ProcessReceiptTaxRoute =
  | "standard_receipt_tax"
  | "us_1099_vision";

export function pickProcessReceiptTaxRoute(params: {
  dataRegion: TaxRegion;
  captureKind?: IncomeFormType | null;
}): ProcessReceiptTaxRoute {
  return params.dataRegion === "us" && params.captureKind
    ? "us_1099_vision"
    : "standard_receipt_tax";
}
