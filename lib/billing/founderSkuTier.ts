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
  if (isFounderSkuTier(input.intentSkuTier ?? undefined)) {
    return input.intentSkuTier;
  }
  if (
    input.legacyUserIdPath &&
    isFounderSkuTier(input.customDataSkuTier)
  ) {
    return input.customDataSkuTier;
  }
  return undefined;
}
