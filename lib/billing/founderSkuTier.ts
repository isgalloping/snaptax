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
  intentSkuTier?: string | null;
  customDataSkuTier?: string;
  legacyUserIdPath?: boolean;
}): Exclude<FounderTier, "DEFAULT" | "SPECIAL"> | undefined {
  const intentSkuTier = input.intentSkuTier ?? undefined;
  if (isFounderSkuTier(intentSkuTier)) return intentSkuTier;

  if (input.legacyUserIdPath && isFounderSkuTier(input.customDataSkuTier)) {
    return input.customDataSkuTier;
  }

  return undefined;
}
