"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { PWA_APP_ENTRY } from "@/lib/marketing/pwaEntryRedirect";
import { isStandaloneDisplayMode } from "@/lib/pwa/deferredInstall";
import { shouldRedirectStandaloneToApp } from "@/lib/pwa/standaloneEntryRedirect";

/** Standalone launch outside `/app` (legacy install or iOS shortcut) → product entry. */
export function PwaStandaloneEntryRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isStandaloneDisplayMode()) return;
    if (!shouldRedirectStandaloneToApp(pathname)) return;
    window.location.replace(PWA_APP_ENTRY);
  }, [pathname]);

  return null;
}
