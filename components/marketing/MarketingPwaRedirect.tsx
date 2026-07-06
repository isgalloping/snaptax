"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  PWA_APP_ENTRY,
  shouldRedirectMarketingToApp,
} from "@/lib/marketing/pwaEntryRedirect";
import { isPwaInstalledOnDevice } from "@/lib/pwa/installedDetect";

/** Send installed users from marketing funnel pages to the PWA entry. */
export function MarketingPwaRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (!shouldRedirectMarketingToApp(pathname)) return;

    let cancelled = false;

    void isPwaInstalledOnDevice().then((installed) => {
      if (cancelled || !installed) return;
      window.location.replace(PWA_APP_ENTRY);
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
