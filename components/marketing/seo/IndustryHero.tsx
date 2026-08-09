import Image from "next/image";
import { MarketingAppLink } from "@/components/marketing/MarketingAppLink";
import { IndustryBreadcrumb } from "@/components/marketing/seo/IndustryBreadcrumb";
import { MARKETING_HERO_SCREENS } from "@/lib/marketing/heroScreens";
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

function renderSpotlightH1(h1: string) {
  if (!h1.includes("organized.")) {
    return h1;
  }
  const idx = h1.indexOf("organized.");
  const before = h1.slice(0, idx);
  const accent = h1.slice(idx);
  return (
    <>
      {before}
      <span style={{ color: MARKETING_TOKENS.accentGreen }}>{accent}</span>
    </>
  );
}

export function IndustryHero({ page }: { page: IndustrySeoPage }) {
  const defaultPhone = MARKETING_HERO_SCREENS[0];
  const phoneImage = page.hero.phoneImage;
  const useSpotlight =
    page.hero.visualLayout === "spotlight" &&
    Boolean(phoneImage) &&
    Boolean(page.hero.highlights?.length);
  const useComposite =
    page.hero.visualLayout === "composite" && Boolean(phoneImage);

  const gridClass = useSpotlight
    ? "mt-8 grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.85fr)_minmax(0,0.9fr)] lg:gap-10"
    : useComposite
      ? "mt-8 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10"
      : "mt-8 grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10";

  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <IndustryBreadcrumb
          industryLabel={page.label}
          industryHref={page.path}
        />

        <div className={gridClass}>
          <div className="min-w-0">
            {useSpotlight ? (
              <>
                <p
                  className="inline-block rounded-full border px-4 py-1.5 text-sm font-bold sm:text-base"
                  style={{
                    color: MARKETING_TOKENS.accentGreen,
                    borderColor: `${MARKETING_TOKENS.accentGreen}4D`,
                    backgroundColor: `${MARKETING_TOKENS.accentGreen}1A`,
                  }}
                >
                  {page.hero.subtitle}
                </p>
                <h1 className="mt-4 whitespace-pre-line text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                  {renderSpotlightH1(page.hero.h1)}
                </h1>
              </>
            ) : (
              <>
                <h1 className="whitespace-pre-line text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                  {page.hero.h1}
                </h1>
                <p
                  className="mt-4 text-lg font-bold sm:text-xl"
                  style={{ color: MARKETING_TOKENS.accentGreen }}
                >
                  {page.hero.subtitle}
                </p>
              </>
            )}
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
                href={page.hero.secondaryHref}
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

          {useSpotlight && phoneImage ? (
            <>
              <div className="mx-auto w-full max-w-[16rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={phoneImage.src}
                  alt={phoneImage.alt}
                  className="h-auto w-full rounded-[1.35rem] border border-white/10 shadow-2xl"
                />
              </div>
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.hero.workerImage.src}
                    alt={page.hero.workerImage.alt}
                    className="h-auto w-full object-cover"
                  />
                </div>
                <ul className="space-y-3">
                  {page.hero.highlights!.map((item) => (
                    <li key={item.title}>
                      <p className="font-bold text-white">{item.title}</p>
                      <p className="text-sm text-zinc-400">{item.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : useComposite && phoneImage ? (
            <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
              <div
                className="absolute inset-0 rounded-[2rem] opacity-25 blur-3xl"
                style={{ backgroundColor: MARKETING_TOKENS.accentGreen }}
                aria-hidden
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={phoneImage.src}
                alt={phoneImage.alt}
                className="relative h-auto w-full rounded-[1.35rem] border border-white/10 shadow-2xl"
              />
              <div className="absolute bottom-3 left-3 w-[30%] overflow-hidden rounded-xl border border-white/15 shadow-xl sm:bottom-4 sm:left-4 sm:rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.hero.workerImage.src}
                  alt={page.hero.workerImage.alt}
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          ) : (
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
                {phoneImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={phoneImage.src}
                    alt={phoneImage.alt}
                    className="relative h-auto w-full rounded-[1.35rem] border border-white/10 shadow-2xl"
                  />
                ) : (
                  <Image
                    src={defaultPhone.src}
                    alt={defaultPhone.alt}
                    width={defaultPhone.width}
                    height={defaultPhone.height}
                    priority
                    className="relative h-auto w-full rounded-[1.35rem] border border-white/10 shadow-2xl"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
