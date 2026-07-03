import type { FounderStatus } from "./types";
import { FOUNDER_SEATS_TOTAL } from "./types";

export type FounderVisibilityInput = {
  enabled: boolean;
  claimedCount: number;
  founderStatus: FounderStatus;
  /** Hide marketing widget when user already paid Export this season. */
  currentSeasonEntitled?: boolean;
};

export function isFounderWidgetVisible(input: FounderVisibilityInput): boolean {
  if (!input.enabled) return false;
  if (input.claimedCount >= FOUNDER_SEATS_TOTAL) return false;
  if (input.founderStatus === "active") return false;
  if (input.currentSeasonEntitled === true) return false;
  return true;
}
