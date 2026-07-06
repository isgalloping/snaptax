/** PWA product entry — must match manifest `start_url`. */
export const PWA_APP_ENTRY = "/app";

/**
 * Legal, pricing, and support pages stay reachable in the browser tab
 * (Paddle audit, in-app legal links opened externally).
 */
export const MARKETING_PWA_REDIRECT_EXEMPT_PREFIXES = [
  "/privacy",
  "/terms",
  "/refund",
  "/policies",
  "/security",
  "/data-retention",
  "/cookies",
  "/disclaimer",
  "/help",
  "/pricing",
] as const;

export function shouldRedirectMarketingToApp(pathname: string): boolean {
  if (!pathname || pathname.startsWith(PWA_APP_ENTRY)) return false;

  for (const prefix of MARKETING_PWA_REDIRECT_EXEMPT_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return false;
    }
  }

  return true;
}
