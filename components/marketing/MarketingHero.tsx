import Image from "next/image";
import Link from "next/link";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { MARKETING_HERO_SCREENS } from "@/lib/marketing/heroScreens";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

type ValuePropIcon = (typeof MARKETING_COPY.hero.valueProps)[number]["icon"];

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

function ShieldTrustIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path
        d="M10 2 4 4.5v5.2c0 3.1 2.4 5.4 6 7.3 3.6-1.9 6-4.2 6-7.3V4.5L10 2z"
        style={{ stroke: MARKETING_TOKENS.accentGreen }}
      />
    </svg>
  );
}

function ValuePropIconMark({ icon }: { icon: ValuePropIcon }) {
  const stroke = MARKETING_TOKENS.accentGreen;

  if (icon === "contractor") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={stroke} strokeWidth="1.6" aria-hidden>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M6 20c.8-3.2 3-5 6-5s5.2 1.8 6 5" />
        <path d="m16 8 2 1.5-1.5 1.5" />
      </svg>
    );
  }

  if (icon === "reports") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={stroke} strokeWidth="1.6" aria-hidden>
        <path d="M8 4h8v16H8z" />
        <path d="M10 8h4M10 12h4M10 16h3" />
        <path d="M14 6h3v4h-3z" />
      </svg>
    );
  }

  if (icon === "secure") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={stroke} strokeWidth="1.6" aria-hidden>
        <path d="M12 3 5 6v5c0 4.2 3 7.4 7 9 4-1.6 7-4.8 7-9V6l-7-3z" />
        <path d="M10 12.5 11.5 14 14 10.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={stroke} strokeWidth="1.6" aria-hidden>
      <path d="M12 3 5 6v5c0 4.2 3 7.4 7 9 4-1.6 7-4.8 7-9V6l-7-3z" />
      <path d="M12 9v6M9.5 12h5" />
    </svg>
  );
}

export function MarketingHero() {
  const { hero } = MARKETING_COPY;

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-black/20">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-900/80"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 xl:gap-10">
          <div className="min-w-0">
            <p className="inline-flex rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-semibold text-green-300">
              {hero.pill}
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              {hero.titleLead}{" "}
              <span style={{ color: MARKETING_TOKENS.accentGreen }}>
                {hero.titleHighlight}
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-300">
              {hero.subtitle}
            </p>
            <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {hero.checklist.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-zinc-200 sm:text-base"
                >
                  <CheckIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-row flex-nowrap items-center gap-2.5 sm:gap-3">
              <Link
                href="/app"
                className="inline-flex min-h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-5 text-sm font-black text-black transition-transform active:scale-95 sm:min-h-14 sm:px-6 sm:text-base"
                style={{ backgroundColor: MARKETING_TOKENS.ctaYellow }}
              >
                {hero.primaryCta}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex min-h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-white/25 px-5 text-sm font-bold text-white transition-colors hover:border-white/50 sm:min-h-14 sm:px-6 sm:text-base"
              >
                {hero.secondaryCta}
              </Link>
            </div>
            <p className="mt-8 flex items-center gap-2 text-sm text-zinc-300">
              <ShieldTrustIcon />
              {hero.trustStrip}
            </p>
          </div>

          <div className="relative z-0 mx-auto min-w-0 w-full max-w-[24rem] sm:max-w-[26rem] lg:mx-0 lg:max-w-none lg:justify-self-end">
            <div
              className="absolute inset-0 rounded-[2.5rem] opacity-25 blur-3xl"
              style={{ backgroundColor: MARKETING_TOKENS.accentGreen }}
              aria-hidden
            />
            <div className="relative ml-auto w-full max-w-[24rem] sm:max-w-[26rem] xl:max-w-[27rem]">
              <div className="relative flex items-end justify-center gap-2 sm:gap-3">
                <div className="relative w-[48%] shrink-0">
                  <Image
                    src={MARKETING_HERO_SCREENS[0].src}
                    alt={MARKETING_HERO_SCREENS[0].alt}
                    width={MARKETING_HERO_SCREENS[0].width}
                    height={MARKETING_HERO_SCREENS[0].height}
                    priority
                    className="h-auto w-full rounded-[1.35rem] border border-white/10 shadow-2xl"
                  />
                </div>
                <div className="relative w-[48%] shrink-0 translate-y-8 sm:translate-y-10">
                  <Image
                    src={MARKETING_HERO_SCREENS[1].src}
                    alt={MARKETING_HERO_SCREENS[1].alt}
                    width={MARKETING_HERO_SCREENS[1].width}
                    height={MARKETING_HERO_SCREENS[1].height}
                    priority
                    className="h-auto w-full rounded-[1.35rem] border border-white/10 shadow-2xl ring-1 ring-yellow-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <ul className="relative z-10 min-w-0 space-y-6 lg:pl-2 xl:pl-4">
            {hero.valueProps.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-green-500/25 bg-green-500/5"
                  aria-hidden
                >
                  <ValuePropIconMark icon={item.icon} />
                </span>
                <div>
                  <p className="font-bold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">{item.subtitle}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
