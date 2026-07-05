import Link from "next/link";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

export const metadata = buildMarketingMetadata({
  title: "Features — SnapTax",
  description:
    "AI receipt scanning, expense tracking, and tax-ready exports for 1099 contractors.",
  path: "/features",
});

export default function FeaturesPage() {
  const { features } = MARKETING_COPY;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black text-white sm:text-4xl">
        {features.sectionTitle}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
        {features.pageIntro}
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.items.map((feature) => (
          <li
            key={feature.title}
            className="rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-black text-white">{feature.title}</h2>
              {"comingSoon" in feature && feature.comingSoon ? (
                <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-300">
                  Coming soon
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {feature.body}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-16 space-y-10 border-t border-white/10 pt-16">
        {features.detailed.map((section) => (
          <section key={section.title} className="max-w-3xl">
            <h2 className="text-xl font-black text-white">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {section.body}
            </p>
          </section>
        ))}
      </div>
      <Link
        href="/app"
        className="mt-12 inline-flex min-h-14 items-center rounded-xl px-8 text-lg font-black text-black transition-transform active:scale-95"
        style={{ backgroundColor: MARKETING_TOKENS.ctaYellow }}
      >
        Get Started
      </Link>
    </div>
  );
}
