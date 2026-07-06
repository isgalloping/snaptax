import { MarketingAppLink } from "@/components/marketing/MarketingAppLink";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";
import type { FounderTier } from "@/lib/founder/types";
import { FOUNDER_SEATS_TOTAL } from "@/lib/founder/types";

export type MarketingPricingCardModel = {
  tier: FounderTier | "CURRENT";
  label: string;
  priceLabel: string;
  availability: string;
};

const TIER_SEAT_BOUNDS: Partial<
  Record<FounderTier, { start: number; end: number }>
> = {
  FOUNDER_LEVEL_SUPER: { start: 1, end: 10 },
  EARLY: { start: 11, end: 30 },
  FOUNDER: { start: 31, end: 50 },
};

function spotsLeftInTier(claimedCount: number, start: number, end: number): number {
  if (claimedCount >= end) return 0;
  const claimedInTier = Math.max(0, claimedCount - (start - 1));
  return end - start + 1 - claimedInTier;
}

function formatAvailability(
  tier: FounderTier,
  claimedCount: number,
  programOpen: boolean,
): string {
  if (tier === "DEFAULT") {
    return MARKETING_COPY.pricing.alwaysAvailable;
  }
  if (!programOpen) {
    return MARKETING_COPY.pricing.soldOut;
  }
  const bounds = TIER_SEAT_BOUNDS[tier];
  if (!bounds) return MARKETING_COPY.pricing.alwaysAvailable;
  const left = spotsLeftInTier(claimedCount, bounds.start, bounds.end);
  if (left <= 0) return MARKETING_COPY.pricing.soldOut;
  return left === 1 ? "Only 1 spot" : `Only ${left} spots`;
}

/** Map founder row seat range to mockup-style plan title. */
export function planLabelFromSeatRange(
  label: string,
  seatRange: string,
): string {
  if (seatRange === "51+") return "Standard";
  return `Founder #${seatRange.replace("–", "-")}`;
}

export function buildMarketingPricingCards(
  live: NonNullable<import("@/lib/legal/pricingPageData").PricingPageLiveData>,
): MarketingPricingCardModel[] {
  const claimedCount =
    live.founderSeatsRemaining != null
      ? FOUNDER_SEATS_TOTAL - live.founderSeatsRemaining
      : 0;

  if (live.showFounderTable && live.founderRows.length > 0) {
    return live.founderRows.map((row) => ({
      tier: row.tier,
      label: planLabelFromSeatRange(row.label, row.seatRange),
      priceLabel: row.priceLabel,
      availability: formatAvailability(
        row.tier,
        claimedCount,
        live.showFounderTable,
      ),
    }));
  }

  return [
    {
      tier: "CURRENT",
      label: "Standard",
      priceLabel: live.priceLabel,
      availability: MARKETING_COPY.pricing.alwaysAvailable,
    },
  ];
}

function CheckIcon() {
  return (
    <span
      className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-black"
      style={{ backgroundColor: MARKETING_TOKENS.accentGreen }}
      aria-hidden
    >
      ✓
    </span>
  );
}

export function MarketingPricingCard({
  card,
}: {
  card: MarketingPricingCardModel;
}) {
  const { pricing } = MARKETING_COPY;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-center text-sm font-black text-white">{card.label}</h3>
      <p className="mt-4 text-center text-4xl font-black text-white">
        {card.priceLabel.replace(/\.00$/, "")}
      </p>
      <p
        className="mt-1 text-center text-sm font-bold"
        style={{ color: MARKETING_TOKENS.accentGreen }}
      >
        {pricing.seasonLabel}
      </p>
      <ul className="mt-6 space-y-2.5">
        {pricing.cardBullets.map((bullet) => (
          <li key={bullet} className="flex gap-2 text-sm text-zinc-300">
            <CheckIcon />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      <p
        className="mt-6 rounded-lg px-3 py-2 text-center text-xs font-bold"
        style={{
          backgroundColor: `${MARKETING_TOKENS.accentGreen}22`,
          color: MARKETING_TOKENS.accentGreen,
        }}
      >
        {card.availability}
      </p>
      <MarketingAppLink
        className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl text-sm font-black text-black transition-transform active:scale-95"
        style={{ backgroundColor: MARKETING_TOKENS.ctaYellow }}
      >
        {MARKETING_COPY.hero.primaryCta}
      </MarketingAppLink>
    </article>
  );
}

export function MarketingPricingCardsGrid({
  cards,
}: {
  cards: MarketingPricingCardModel[];
}) {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <MarketingPricingCard key={`${card.tier}-${card.label}`} card={card} />
      ))}
    </div>
  );
}
