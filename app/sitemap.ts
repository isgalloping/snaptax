import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/site/publicSiteUrl";

const PUBLIC_PATHS = [
  "/",
  "/privacy",
  "/terms",
  "/help",
  "/pricing",
  "/policies",
  "/security",
  "/data-retention",
  "/refund",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicSiteUrl();
  const lastModified = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? baseUrl : `${baseUrl}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.6,
  }));
}
