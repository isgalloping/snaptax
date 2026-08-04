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

export function resolveFounderSeatSkuTier(input: {
  intentSkuTier: string | null | undefined;
  customDataSkuTier: string | undefined;
  legacyUserIdPath: boolean;
}): Exclude<FounderTier, "DEFAULT" | "SPECIAL"> | undefined {
  const intentTier = input.intentSkuTier ?? undefined;
  if (isFounderSkuTier(intentTier)) {
    return intentTier;
  }
  if (
    input.legacyUserIdPath &&
    isFounderSkuTier(input.customDataSkuTier)
  ) {
    return input.customDataSkuTier;
  }
  return undefined;
}
