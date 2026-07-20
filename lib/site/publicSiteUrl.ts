const DEFAULT_PUBLIC_SITE_URL = "https://snaptax.lightxforge.com";

/** Canonical public site origin for robots, sitemap, and share links. */
export function getPublicSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return vercel.startsWith("http") ? vercel.replace(/\/$/, "") : `https://${vercel}`;
  }

  return DEFAULT_PUBLIC_SITE_URL;
}
