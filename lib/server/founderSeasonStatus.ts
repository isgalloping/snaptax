import type { FounderStatus } from "@/lib/founder/types";

export type ResolveEffectiveFounderStatusInput = {
  storedStatus: FounderStatus;
  founderNumber: number | null;
  currentSeasonEntitled: boolean;
};

/**
 * Founder season gate: locked tier only when active **and** paid for current tax season.
 * Founders without current-season entitlement are lapsed (DEFAULT renewal pricing).
 */
export function resolveEffectiveFounderStatus(
  input: ResolveEffectiveFounderStatusInput,
): FounderStatus {
  const { storedStatus, founderNumber, currentSeasonEntitled } = input;

  if (founderNumber == null) {
    return storedStatus === "active" || storedStatus === "lapsed"
      ? storedStatus
      : "none";
  }

  if (currentSeasonEntitled) {
    return "active";
  }

  return "lapsed";
}

export function shouldPersistFounderStatusSync(
  storedStatus: FounderStatus,
  effectiveStatus: FounderStatus,
  founderNumber: number | null,
): boolean {
  if (founderNumber == null) return false;
  return storedStatus !== effectiveStatus;
}
