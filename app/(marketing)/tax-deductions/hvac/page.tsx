import { notFound } from "next/navigation";
import { JsonLd } from "@/components/marketing/JsonLd";
import { IndustrySeoPageView } from "@/components/marketing/seo/IndustrySeoPage";
import { getIndustryBySlug } from "@/lib/marketing/seo/industries";
import { buildIndustryJsonLd } from "@/lib/marketing/seo/jsonLd";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

const page = getIndustryBySlug("hvac");

export const metadata = page
  ? buildMarketingMetadata({
      title: page.seo.title,
      description: page.seo.description,
      path: page.path,
      imagePath: page.hero.ogImage.src,
      imageAlt: page.hero.ogImage.alt,
    })
  : buildMarketingMetadata({
      title: "Not found",
      description: "Not found",
      path: "/tax-deductions/hvac",
    });

export default function HvacTaxDeductionsPage() {
  const industry = getIndustryBySlug("hvac");
  if (!industry) notFound();

  return (
    <>
      <JsonLd data={buildIndustryJsonLd(industry)} />
      <IndustrySeoPageView page={industry} />
    </>
  );
}
