import { computeEuTaxAmount } from "@/lib/tax/computeEu";
import { computeUsTaxAmount } from "@/lib/tax/computeUs";
import type { EuAiFields, TaxRegion, UsAiFields } from "@/lib/tax/types";

export function computeTaxAmount(region: "us", fields: UsAiFields): number;
export function computeTaxAmount(region: "eu", fields: EuAiFields): number;
export function computeTaxAmount(
  region: TaxRegion,
  fields: UsAiFields | EuAiFields,
): number {
  if (region === "eu") {
    return computeEuTaxAmount(fields as EuAiFields);
  }
  return computeUsTaxAmount(fields as UsAiFields);
}
