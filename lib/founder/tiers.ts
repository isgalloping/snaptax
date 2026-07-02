import { FOUNDER_SEATS_TOTAL, type FounderTier } from "./types";
export { FOUNDER_SEATS_TOTAL };

export function tierForSeat(seat: number): FounderTier | null {
  if (seat < 1 || seat > 50) return null;
  if (seat <= 10) return "FOUNDER_LEVEL_SUPER";
  if (seat <= 30) return "EARLY";
  return "FOUNDER";
}

export function nextSeatNumber(claimedCount: number): number | null {
  if (claimedCount >= FOUNDER_SEATS_TOTAL) return null;
  return claimedCount + 1;
}

export function tierDisplayLabel(tier: FounderTier): string {
  switch (tier) {
    case "FOUNDER_LEVEL_SUPER":
      return "Super Founder";
    case "EARLY":
      return "Early Founder";
    case "FOUNDER":
      return "Founder";
    default:
      return "Standard";
  }
}
