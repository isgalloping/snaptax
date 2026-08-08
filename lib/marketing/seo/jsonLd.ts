import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { getPublicSiteUrl } from "@/lib/site/publicSiteUrl";

export function buildIndustryJsonLd(
  page: IndustrySeoPage,
): Record<string, unknown> {
  const base = getPublicSiteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: page.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${base}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Tax Deductions",
            item: `${base}/tax-deductions`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: page.label,
            item: `${base}${page.path}`,
          },
        ],
      },
    ],
  };
}
