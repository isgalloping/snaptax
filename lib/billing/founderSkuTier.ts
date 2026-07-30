import type { FounderTier } from "@/lib/founder/types";

export function isFounderSkuTier(
  tier: string | undefined,
): tier is Exclude<FounderTier, "DEFAULT" | "SPECIAL"> {
  return (
    tier === "FOUNDER_LEVEL_SUPER" ||
    tier === "EARLY" ||
    tier === "FOUNDER"
  );
}

export function resolveFounderSeatSkuTier(
  intentSkuTier: string | null | undefined,
  _customDataSkuTier?: string | null | undefined,
): Exclude<FounderTier, "DEFAULT" | "SPECIAL"> | undefined {
  return isFounderSkuTier(intentSkuTier ?? undefined)
    ? intentSkuTier
    : undefined;
}
