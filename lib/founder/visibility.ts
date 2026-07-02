import type { FounderStatus } from "./types.ts";
import { FOUNDER_SEATS_TOTAL } from "./types.ts";

export type FounderVisibilityInput = {
  enabled: boolean;
  claimedCount: number;
  founderStatus: FounderStatus;
};

export function isFounderWidgetVisible(input: FounderVisibilityInput): boolean {
  if (!input.enabled) return false;
  if (input.claimedCount >= FOUNDER_SEATS_TOTAL) return false;
  if (input.founderStatus === "active") return false;
  return true;
}
