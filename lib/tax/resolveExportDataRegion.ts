import type { TaxRegion } from "@/lib/tax/types";
import type { Receipt } from "@/lib/types";

/** Prefer an explicit region, then the first receipt region, else US MVP default. */
export function resolveExportDataRegion(
  receipts: Receipt[],
  explicit?: TaxRegion,
): TaxRegion {
  if (explicit === "eu" || explicit === "us") return explicit;
  for (const receipt of receipts) {
    const region = receipt.dataRegion?.trim().toLowerCase();
    if (region === "eu") return "eu";
    if (region === "us") return "us";
  }
  return "us";
}
