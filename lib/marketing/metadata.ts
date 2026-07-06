import type { Metadata } from "next";
import { getPublicSiteUrl } from "@/lib/site/publicSiteUrl";

const OG_IMAGE_PATH = "/marketing/hero-phone.png";

export function buildMarketingMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const siteUrl = getPublicSiteUrl();
  const url = `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const ogImage = `${siteUrl}${OG_IMAGE_PATH}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "SnapTax",
      type: "website",
      images: [{ url: ogImage, alt: "SnapTax expense tracking app" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
