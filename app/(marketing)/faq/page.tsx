import { MARKETING_COPY } from "@/lib/marketing/copy";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";
import { MarketingFaqByCategory } from "@/components/marketing/MarketingFaqList";

export const metadata = buildMarketingMetadata({
  title: "FAQ — SnapTax",
  description: "Answers about SnapTax pricing, payments, features, and security.",
  path: "/faq",
});

export default function FaqPage() {
  const { faq } = MARKETING_COPY;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black text-white">{faq.sectionTitle}</h1>
      <p className="mt-4 text-sm text-zinc-400">
        One-time payment per tax season. No monthly subscription.
      </p>
      <div className="mt-10">
        <MarketingFaqByCategory categories={[...faq.categories]} />
      </div>
    </div>
  );
}
