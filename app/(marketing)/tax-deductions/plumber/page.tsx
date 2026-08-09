import { notFound } from "next/navigation";
import { JsonLd } from "@/components/marketing/JsonLd";
import { IndustrySeoPageView } from "@/components/marketing/seo/IndustrySeoPage";
import { getIndustryBySlug } from "@/lib/marketing/seo/industries";
import { buildIndustryJsonLd } from "@/lib/marketing/seo/jsonLd";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

const page = getIndustryBySlug("plumber");

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
      path: "/tax-deductions/plumber",
    });

export default function PlumberTaxDeductionsPage() {
  const industry = getIndustryBySlug("plumber");
  if (!industry) notFound();

  return (
    <>
      <JsonLd data={buildIndustryJsonLd(industry)} />
      <IndustrySeoPageView page={industry} />
    </>
  );
}
