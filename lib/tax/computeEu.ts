import type { EuAiFields } from "@/lib/tax/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeEuVatAmount(fields: EuAiFields): number | null {
  if (fields.vat_amount != null && fields.vat_amount >= 0) {
    return fields.vat_amount;
  }
  if (
    fields.vat_rate != null &&
    fields.vat_rate > 0 &&
    fields.amount > 0
  ) {
    return round2((fields.amount * fields.vat_rate) / (1 + fields.vat_rate));
  }
  return null;
}

export function computeEuTaxAmount(fields: EuAiFields): number {
  if (!fields.deductible) return 0;
  const vat = computeEuVatAmount(fields);
  if (vat == null) return 0;
  return round2(vat);
}
