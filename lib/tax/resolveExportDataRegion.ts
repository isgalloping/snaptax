import type { TaxRegion } from "@/lib/tax/types";
import type { Receipt } from "@/lib/types";

/** Prefer explicit region, then signed-in user lock, then receipt snapshot, else US. */
export function resolveExportDataRegion(
  receipts: Receipt[],
  explicit?: TaxRegion,
  userLockedRegion?: TaxRegion,
): TaxRegion {
  if (explicit === "eu" || explicit === "us") return explicit;
  if (userLockedRegion === "eu" || userLockedRegion === "us") {
    return userLockedRegion;
  }
  for (const receipt of receipts) {
    const region = receipt.dataRegion?.trim().toLowerCase();
    if (region === "eu") return "eu";
    if (region === "us") return "us";
  }
  return "us";
}
