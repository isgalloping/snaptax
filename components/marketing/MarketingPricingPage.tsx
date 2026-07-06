import Link from "next/link";
import { PricingPageBody } from "@/components/legal/PricingPageBody";
import {
  buildMarketingPricingCards,
  MarketingPricingCardsGrid,
} from "@/components/marketing/MarketingPricingCard";
import { MarketingPaymentMethods } from "@/components/marketing/MarketingPaymentMethods";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";
import type { ParsedLegalMarkdown } from "@/lib/legal/markdownDoc";
import type { PricingPageLiveData } from "@/lib/legal/pricingPageData";

export function MarketingPricingPage({
  doc,
  live,
}: {
  doc: ParsedLegalMarkdown;
  live: PricingPageLiveData | null;
}) {
  const { pricing } = MARKETING_COPY;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">
          {pricing.pageTitle}
        </h1>
        <p className="mt-4 text-lg text-zinc-300">
          {pricing.footer}
        </p>
      </header>

      {live ? (
        <>
          {live.founderSeatsRemaining != null ? (
            <p className="mt-6 text-sm font-semibold text-zinc-300">
              {live.founderSeatsRemaining} Founder seats remaining
            </p>
          ) : null}
          <MarketingPricingCardsGrid cards={buildMarketingPricingCards(live)} />
        </>
      ) : (
        <p className="mt-10 rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
          {pricing.liveFallback}
        </p>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-black text-white">What&apos;s included</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {pricing.includedFeatures.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2 text-sm text-zinc-200"
            >
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: MARKETING_TOKENS.accentGreen }}
                aria-hidden
              />
              {feature}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          Payment methods
        </h2>
        <p className="mt-2 text-sm text-zinc-300">{pricing.paymentMethods}</p>
        <MarketingPaymentMethods className="mt-4" />
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/app"
          className="flex min-h-14 items-center justify-center rounded-xl px-8 text-lg font-black text-black transition-transform active:scale-95"
          style={{ backgroundColor: MARKETING_TOKENS.ctaYellow }}
        >
          Get Started
        </Link>
        <Link
          href="/contact"
          className="flex min-h-14 items-center justify-center rounded-xl border border-white/20 px-8 text-lg font-bold text-white"
        >
          Contact support
        </Link>
      </div>

      <div className="mt-16 border-t border-white/10 pt-10">
        <PricingPageBody
          doc={doc}
          live={null}
          embedded
          embeddedFlush
          hideHubSections
          hideLiveBlock
          embeddedTitleAs="h2"
        />
      </div>
    </div>
  );
}
