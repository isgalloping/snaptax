import { MARKETING_COPY } from "@/lib/marketing/copy";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

export const metadata = buildMarketingMetadata({
  title: "About — SnapTax",
  description:
    "SnapTax helps contractors and small businesses track expenses and save money at tax time.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black text-white">About SnapTax</h1>
      <p className="mt-6 text-lg leading-relaxed text-zinc-300">
        {MARKETING_COPY.footer.tagline}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">
        {MARKETING_COPY.hero.subtitle}
      </p>
    </div>
  );
}
