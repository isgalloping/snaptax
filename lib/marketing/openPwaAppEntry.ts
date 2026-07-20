import { PWA_APP_ENTRY } from "@/lib/marketing/pwaEntryRedirect";

/**
 * Full document navigation to the PWA entry.
 * Must run from a user gesture — Next.js `<Link>` client routing does not
 * trigger Chrome Navigation Capturing / Android WebAPK intent filters.
 */
export function openPwaAppEntry(): void {
  if (typeof window === "undefined") return;
  window.location.assign(PWA_APP_ENTRY);
}
