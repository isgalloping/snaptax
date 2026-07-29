import { getPublicSiteUrl } from "@/lib/site/publicSiteUrl";

const PROD_DISPLAY_NAME = "SnapTax";
const PREVIEW_DISPLAY_NAME = "SnapTax-Pre";

/** PWA install / tab / Apple web app title only — not in-app marketing copy. */
export function getAppDisplayName(): string {
  try {
    const hostname = new URL(getPublicSiteUrl()).hostname;
    if (hostname.includes("snaptax-pre")) {
      return PREVIEW_DISPLAY_NAME;
    }
  } catch {
    // invalid URL — fall through to production name
  }
  return PROD_DISPLAY_NAME;
}
