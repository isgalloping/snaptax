import { PWA_APP_ENTRY } from "@/lib/marketing/pwaEntryRedirect";

/** Paths that may load outside `/app` even in standalone (offline fallback). */
export const STANDALONE_ENTRY_REDIRECT_EXEMPT_PREFIXES = [
  "/offline",
] as const;

export function shouldRedirectStandaloneToApp(pathname: string): boolean {
  if (!pathname || pathname.startsWith(PWA_APP_ENTRY)) return false;

  for (const prefix of STANDALONE_ENTRY_REDIRECT_EXEMPT_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return false;
    }
  }

  return true;
}

export function resolveStandaloneEntryRedirect(pathname: string): string | null {
  return shouldRedirectStandaloneToApp(pathname) ? PWA_APP_ENTRY : null;
}
