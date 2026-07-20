import type { MetadataRoute } from "next";
import { listBlogSlugs } from "@/lib/marketing/blog";
import { getPublicSiteUrl } from "@/lib/site/publicSiteUrl";

const PUBLIC_PATHS = [
  "/",
  "/pricing",
  "/features",
  "/faq",
  "/contact",
  "/about",
  "/blog",
  "/privacy",
  "/terms",
  "/refund",
  "/policies",
  "/security",
  "/data-retention",
  "/help",
  "/disclaimer",
  "/cookies",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicSiteUrl();
  const lastModified = new Date();

  const staticEntries = PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? baseUrl : `${baseUrl}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.6,
  }));

  const blogEntries = listBlogSlugs().map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticEntries, ...blogEntries];
}
