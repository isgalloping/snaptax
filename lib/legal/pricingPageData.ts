import type { FounderTier } from "@/lib/founder/types";
import { formatCurrency } from "@/lib/format";
import { getFounderProgramState } from "@/lib/server/founderProgram";
import type { FounderTierConfig } from "@/lib/server/founderConfig";
import { getSeasonOffer } from "@/lib/server/seasonOffer";

const FOUNDER_TIER_LABELS: Record<FounderTier, string> = {
  FOUNDER_LEVEL_SUPER: "Super Founder",
  EARLY: "Early",
  FOUNDER: "Founder",
  DEFAULT: "Standard",
};

export type PricingFounderTierRow = {
  tier: FounderTier;
  label: string;
  seatRange: string;
  priceLabel: string;
  note: string;
};

export type PricingPageLiveData = {
  taxSeason: string;
  priceLabel: string;
  skuTier: FounderTier;
  showFounderTable: boolean;
  founderRows: PricingFounderTierRow[];
};

function formatSeatRange(seatRange: [number, number] | null): string {
  if (!seatRange) return "51+";
  return `${seatRange[0]}–${seatRange[1]}`;
}

/** @internal exported for unit tests */
export function buildFounderRows(
  tiers: Record<FounderTier, FounderTierConfig>,
): PricingFounderTierRow[] {
  const order: FounderTier[] = [
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
        : "Locked for life while Founder status stays active";

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

  return {
    taxSeason: offer.taxSeason,
    priceLabel: formatCurrency(offer.priceUsd),
    skuTier: offer.skuTier,
    showFounderTable,
    founderRows: showFounderTable ? buildFounderRows(state.tiers) : [],
  };
}
