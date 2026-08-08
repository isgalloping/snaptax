import { MarketingAppLink } from "@/components/marketing/MarketingAppLink";
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

export function IndustryFinalCta({ page }: { page: IndustrySeoPage }) {
  const { finalCta } = page;

  return (
    <section className="border-t border-white/10 bg-black/20">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          {finalCta.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          {finalCta.body}
        </p>
        <div className="mt-8">
          <MarketingAppLink
            className="inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-sm font-black text-black transition-transform active:scale-95 sm:min-h-14 sm:px-8 sm:text-base"
            style={{ backgroundColor: MARKETING_TOKENS.ctaYellow }}
          >
            {finalCta.button}
          </MarketingAppLink>
        </div>
        <p className="mt-4 text-sm text-zinc-400">{finalCta.noCardRequired}</p>
      </div>
    </section>
  );
}
