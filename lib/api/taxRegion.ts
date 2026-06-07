import type { TaxRegion } from "@/lib/tax/types";

export function parseTaxRegionHeader(request: Request): TaxRegion {
  const v = request.headers.get("x-tax-region")?.toLowerCase();
  return v === "eu" ? "eu" : "us";
}
