"use client";

import { useServerInsertedHTML } from "next/navigation";
import { INLINE_MARKETING_PWA_REDIRECT_SCRIPT } from "@/lib/marketing/marketingPwaRedirectScript";

/** Sticky-flag redirect before paint — pairs with MarketingPwaRedirect for Chromium API. */
export function MarketingPwaRedirectScript() {
  useServerInsertedHTML(() => (
    <script
      id="snaptax-marketing-pwa-redirect"
      dangerouslySetInnerHTML={{ __html: INLINE_MARKETING_PWA_REDIRECT_SCRIPT }}
    />
  ));

  return null;
}
