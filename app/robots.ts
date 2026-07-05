import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/site/publicSiteUrl";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/app"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
