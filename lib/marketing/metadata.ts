import type { Metadata } from "next";
import { getPublicSiteUrl } from "@/lib/site/publicSiteUrl";

const DEFAULT_OG_IMAGE_PATH = "/marketing/hero-phone.png";
const DEFAULT_OG_ALT = "SnapTax expense tracking app";

export function buildMarketingMetadata({
  title,
  description,
  path,
  imagePath = DEFAULT_OG_IMAGE_PATH,
  imageAlt = DEFAULT_OG_ALT,
}: {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
  imageAlt?: string;
}): Metadata {
  const siteUrl = getPublicSiteUrl();
  const url = `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const resolvedImagePath = imagePath.startsWith("/")
    ? imagePath
    : `/${imagePath}`;
  const ogImage = `${siteUrl}${resolvedImagePath}`;

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
      images: [{ url: ogImage, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
