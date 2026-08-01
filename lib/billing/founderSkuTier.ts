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
  customDataSkuTier: string | undefined,
): Exclude<FounderTier, "DEFAULT" | "SPECIAL"> | undefined {
  // Founder seats are scarce; never let client-controlled custom_data choose them.
  void customDataSkuTier;
  return isFounderSkuTier(intentSkuTier ?? undefined)
    ? intentSkuTier
    : undefined;
}
