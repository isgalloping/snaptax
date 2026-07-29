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

export function resolveFounderSkuTierForSeatAssignment(
  intentSkuTier: string | null | undefined,
  customDataSkuTier: string | undefined,
): Exclude<FounderTier, "DEFAULT" | "SPECIAL"> | undefined {
  // Client-controlled customData must not influence founder seat assignment.
  void customDataSkuTier;
  return isFounderSkuTier(intentSkuTier ?? undefined)
    ? intentSkuTier
    : undefined;
}
