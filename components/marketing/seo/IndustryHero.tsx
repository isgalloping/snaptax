import Image from "next/image";
import { MarketingAppLink } from "@/components/marketing/MarketingAppLink";
import { IndustryBreadcrumb } from "@/components/marketing/seo/IndustryBreadcrumb";
import { MARKETING_HERO_SCREENS } from "@/lib/marketing/heroScreens";
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

export function IndustryHero({ page }: { page: IndustrySeoPage }) {
  const phone = MARKETING_HERO_SCREENS[0];

  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <IndustryBreadcrumb
          industryLabel={page.label}
          industryHref={page.path}
        />

        <div className="mt-8 grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
          <div className="min-w-0">
            <h1 className="whitespace-pre-line text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              {page.hero.h1}
            </h1>
            <p
              className="mt-4 text-lg font-bold sm:text-xl"
              style={{ color: MARKETING_TOKENS.accentGreen }}
            >
              {page.hero.subtitle}
            </p>
            <p className="mt-4 max-w-xl whitespace-pre-line text-base leading-relaxed text-zinc-300">
              {page.hero.body}
            </p>

            <div className="mt-8 flex flex-row flex-wrap items-center gap-2.5 sm:gap-3">
              <MarketingAppLink
                className="inline-flex min-h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-5 text-sm font-black text-black transition-transform active:scale-95 sm:min-h-14 sm:px-6 sm:text-base"
                style={{ backgroundColor: MARKETING_TOKENS.ctaYellow }}
              >
                {page.hero.primaryCta}
              </MarketingAppLink>
              <a
                href={`#${page.howItWorks.id}`}
                className="inline-flex min-h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-white/25 px-5 text-sm font-bold text-white transition-colors hover:border-white/50 active:scale-95 sm:min-h-14 sm:px-6 sm:text-base"
              >
                {page.hero.secondaryCta}
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {page.hero.trustItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-zinc-300"
                >
                  <span
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-black"
                    style={{ backgroundColor: MARKETING_TOKENS.accentGreen }}
                    aria-hidden
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto flex w-full max-w-md items-end justify-center gap-3 sm:max-w-lg sm:gap-4 lg:mx-0 lg:max-w-none lg:justify-end">
            {/* Plain img: missing worker asset must not block hero render */}
            <div className="relative w-[40%] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={page.hero.workerImage.src}
                alt={page.hero.workerImage.alt}
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="relative w-[55%] max-w-[16rem] sm:max-w-[18rem]">
              <div
                className="absolute inset-0 rounded-[2rem] opacity-25 blur-3xl"
                style={{ backgroundColor: MARKETING_TOKENS.accentGreen }}
                aria-hidden
              />
              <Image
                src={phone.src}
                alt={phone.alt}
                width={phone.width}
                height={phone.height}
                priority
                className="relative h-auto w-full rounded-[1.35rem] border border-white/10 shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
