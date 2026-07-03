export type FounderTier =
  | "FOUNDER_LEVEL_SUPER"
  | "EARLY"
  | "FOUNDER"
  | "DEFAULT";

export type FounderStatus = "none" | "active" | "lapsed";

export const FOUNDER_SEATS_TOTAL = 50;

/** When remaining seats ≤ this, widget scarcity line turns red (no fake countdown). */
export const FOUNDER_SCARCITY_URGENT_THRESHOLD = 10;
