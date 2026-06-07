import { resolveDeductionRatio, usMarginalRate } from "@/lib/tax/usCategories";
import type { UsAiFields } from "@/lib/tax/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeUsTaxAmount(fields: UsAiFields): number {
  if (!fields.deductible) return 0;
  const ratio = resolveDeductionRatio(fields.category, fields.deduction_ratio);
  if (ratio <= 0) return 0;
  const base = fields.amount * ratio;
  return round2(base * usMarginalRate());
}

export function usDeductibleBase(fields: UsAiFields): number {
  if (!fields.deductible) return 0;
  const ratio = resolveDeductionRatio(fields.category, fields.deduction_ratio);
  return round2(fields.amount * ratio);
}
