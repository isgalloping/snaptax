import { MarketingPricingPage } from "@/components/marketing/MarketingPricingPage";
import { JsonLd } from "@/components/marketing/JsonLd";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";
import { loadPricingPageLiveData } from "@/lib/legal/pricingPageData";
import { loadLegalMarkdown, parseLegalMarkdown } from "@/lib/legal/markdownDoc";
import { getPublicSiteUrl } from "@/lib/site/publicSiteUrl";

export const metadata = buildMarketingMetadata({
  title: "Pricing — SnapTax",
  description:
    "One-time payment per tax season. No monthly subscription. Founder tiers from $5–$29.",
  path: "/pricing",
});

export default async function PricingPage() {
  const doc = parseLegalMarkdown(loadLegalMarkdown("pricing.md"));
  let live = null;
  try {
    live = await loadPricingPageLiveData();
  } catch {
    live = null;
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "SnapTax Export Tax Pack",
          description:
            "One-time payment per tax season. Unlimited re-export within that season.",
          brand: { "@type": "Brand", name: "SnapTax" },
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "USD",
            lowPrice: live?.founderRows[0]?.priceLabel.replace(/[^\d.]/g, "") ?? "5",
            highPrice:
              live?.founderRows.at(-1)?.priceLabel.replace(/[^\d.]/g, "") ?? "29",
            offerCount: live?.founderRows.length ?? 4,
            description: "Per tax season — not a subscription",
            url: `${getPublicSiteUrl()}/pricing`,
          },
        }}
      />
      <MarketingPricingPage doc={doc} live={live} />
    </>
  );
}
