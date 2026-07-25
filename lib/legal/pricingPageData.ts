import type { PublicFounderTier } from "@/lib/founder/types";
import { formatCurrency } from "@/lib/format";
import { getFounderProgramState } from "@/lib/server/founderProgram";
import type { FounderTierConfig } from "@/lib/server/founderConfig";
import { getSeasonOffer } from "@/lib/server/seasonOffer";

const FOUNDER_TIER_LABELS: Record<PublicFounderTier, string> = {
  FOUNDER_LEVEL_SUPER: "Super Founder",
  EARLY: "Early",
  FOUNDER: "Founder",
  DEFAULT: "Standard",
};

export type PricingFounderTierRow = {
  tier: PublicFounderTier;
  label: string;
  seatRange: string;
  priceLabel: string;
  note: string;
};

export type PricingPageLiveData = {
  taxSeason: string;
  priceLabel: string;
  skuTier: PublicFounderTier;
  showFounderTable: boolean;
  founderSeatsRemaining: number | null;
  founderRows: PricingFounderTierRow[];
};

function formatSeatRange(seatRange: [number, number] | null): string {
  if (!seatRange) return "51+";
  return `${seatRange[0]}–${seatRange[1]}`;
}

/** @internal exported for unit tests */
export function buildFounderRows(
  tiers: Record<PublicFounderTier, FounderTierConfig>,
): PricingFounderTierRow[] {
  const order: PublicFounderTier[] = [
    "FOUNDER_LEVEL_SUPER",
    "EARLY",
    "FOUNDER",
    "DEFAULT",
  ];

  return order.map((tier) => {
    const config = tiers[tier];
    const note =
      tier === "DEFAULT"
        ? "After Founder Program seats are filled or status lapses"
        : "Locks this tier price for future tax seasons while Founder status stays active";

    return {
      tier,
      label: FOUNDER_TIER_LABELS[tier],
      seatRange: formatSeatRange(config.seatRange),
      priceLabel: formatCurrency(config.priceUsd),
      note,
    };
  });
}

/** Server-only pricing block for `/pricing` (guest-visible). */
export async function loadPricingPageLiveData(): Promise<PricingPageLiveData> {
  const [offer, state] = await Promise.all([
    getSeasonOffer(),
    getFounderProgramState(),
  ]);

  const showFounderTable = state.enabled && state.programOpen;
  const skuTier: PublicFounderTier =
    offer.skuTier === "SPECIAL" ? "DEFAULT" : offer.skuTier;

  return {
    taxSeason: offer.taxSeason,
    priceLabel: formatCurrency(offer.priceUsd),
    skuTier,
    showFounderTable,
    founderSeatsRemaining: showFounderTable ? state.remaining : null,
    founderRows: showFounderTable ? buildFounderRows(state.tiers) : [],
  };
}
