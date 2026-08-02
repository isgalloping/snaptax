import { isFounderSkuTier } from "@/lib/billing/founderSkuTier";

export function resolveFounderSeatSkuTier(input: {
  intentSkuTier: string | undefined;
  customDataSkuTier: string | undefined;
  legacyUserIdPath: boolean;
}): string | undefined {
  if (isFounderSkuTier(input.intentSkuTier)) {
    return input.intentSkuTier;
  }

  if (input.legacyUserIdPath && isFounderSkuTier(input.customDataSkuTier)) {
    return input.customDataSkuTier;
  }

  return undefined;
}
