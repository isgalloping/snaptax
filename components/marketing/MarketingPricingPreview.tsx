import Link from "next/link";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import {
  buildMarketingPricingCards,
  MarketingPricingCardsGrid,
} from "@/components/marketing/MarketingPricingCard";
import { MarketingPricingFooter } from "@/components/marketing/MarketingPricingFooter";
import type { PricingPageLiveData } from "@/lib/legal/pricingPageData";

export function MarketingPricingPreview({
  live,
}: {
  live: PricingPageLiveData | null;
}) {
  const { pricing } = MARKETING_COPY;
  const cards = live ? buildMarketingPricingCards(live) : [];

  return (
    <section className="border-t border-white/10 bg-black/20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="relative">
          <h2 className="text-center text-2xl font-black text-white sm:text-3xl">
            {pricing.sectionTitle}
          </h2>
          <Link
            href="/pricing"
            className="mt-4 block text-center text-sm font-bold text-zinc-300 underline-offset-4 hover:text-white hover:underline sm:absolute sm:right-0 sm:top-1/2 sm:mt-0 sm:-translate-y-1/2 sm:text-right"
          >
            View full pricing
          </Link>
        </div>
        {cards.length > 0 ? (
          <MarketingPricingCardsGrid cards={cards} />
        ) : (
          <p className="mt-10 text-sm text-zinc-400">{pricing.liveFallback}</p>
        )}
        <MarketingPricingFooter />
      </div>
    </section>
  );
}
