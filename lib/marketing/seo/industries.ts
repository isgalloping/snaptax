import { ELECTRICIAN_SEO_PAGE } from "@/lib/marketing/seo/industries/electrician";
import { HVAC_SEO_PAGE } from "@/lib/marketing/seo/industries/hvac";
import type { IndustrySeoPage, IndustrySlug } from "@/lib/marketing/seo/types";

const PUBLISHED: readonly IndustrySeoPage[] = [
  ELECTRICIAN_SEO_PAGE,
  HVAC_SEO_PAGE,
];

export function listPublishedIndustries(): readonly IndustrySeoPage[] {
  return PUBLISHED;
}

export function getIndustryBySlug(
  slug: string,
): IndustrySeoPage | undefined {
  return PUBLISHED.find((page) => page.slug === slug);
}

export type { IndustrySeoPage, IndustrySlug };
