import type { TaxRegion } from "@/lib/tax/types";

export function shouldRecalcOnLogin(
  lockedRegion: TaxRegion,
  ghostCandidate: TaxRegion,
): boolean {
  return lockedRegion !== ghostCandidate;
}
