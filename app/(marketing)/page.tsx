import { MarketingHero } from "@/components/marketing/MarketingHero";
import { MarketingSteps } from "@/components/marketing/MarketingSteps";
import { MarketingFeatureGrid } from "@/components/marketing/MarketingFeatureGrid";
import { MarketingPricingPreview } from "@/components/marketing/MarketingPricingPreview";
import { MarketingFaqPreview } from "@/components/marketing/MarketingFaqPreview";
import { JsonLd } from "@/components/marketing/JsonLd";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";
import { loadMarketingPricingPreview } from "@/lib/marketing/pricingPreview";
import { getPublicSiteUrl } from "@/lib/site/publicSiteUrl";

export const metadata = buildMarketingMetadata({
  title: "SnapTax — Expense Tracking for 1099 Contractors",
  description:
    "Simple expense tracking and tax preparation for independent contractors. Pay once per tax season.",
  path: "/",
});

export default async function MarketingHomePage() {
  let pricing = null;
  try {
    pricing = await loadMarketingPricingPreview();
  } catch {
    pricing = null;
  }

  const siteUrl = getPublicSiteUrl();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "SnapTax",
              url: siteUrl,
            },
            {
              "@type": "SoftwareApplication",
              name: "SnapTax",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                priceCurrency: "USD",
                description: "One-time payment per tax season",
              },
            },
          ],
        }}
      />
      <MarketingHero />
      <MarketingSteps />
      <MarketingFeatureGrid />
      <MarketingPricingPreview live={pricing} />
      <MarketingFaqPreview />
    </>
  );
}
