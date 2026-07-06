"use client";

import {
  type AnchorHTMLAttributes,
  type MouseEvent,
  useCallback,
  useState,
} from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { openPwaAppEntry } from "@/lib/marketing/openPwaAppEntry";
import { PWA_APP_ENTRY } from "@/lib/marketing/pwaEntryRedirect";
import { shouldInterceptMarketingAppNavigation } from "@/lib/marketing/shouldInterceptMarketingAppNavigation";
import { readPwaInstalledLocally } from "@/lib/pwa/installedDetect";
import { getInstallPlatform } from "@/lib/pwa/installPlatform";

type MarketingAppLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>;

/**
 * Marketing CTA to `/app`. Android Chrome and desktop Chromium use native
 * `<a href>` navigation so WebAPK / Navigation Capturing can launch the app.
 * Safari and Android non-Chrome show a launch-from-home hint when installed.
 */
export function MarketingAppLink({
  onClick,
  children,
  ...rest
}: MarketingAppLinkProps) {
  const copy = useUserCopy().pwa;
  const [launchHintOpen, setLaunchHintOpen] = useState(false);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;

      if (
        shouldInterceptMarketingAppNavigation(
          getInstallPlatform(),
          readPwaInstalledLocally(),
          typeof navigator !== "undefined" ? navigator.userAgent : "",
        )
      ) {
        event.preventDefault();
        setLaunchHintOpen(true);
      }
    },
    [onClick],
  );

  return (
    <>
      <a href={PWA_APP_ENTRY} onClick={handleClick} {...rest}>
        {children}
      </a>
      {launchHintOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="marketing-launch-pwa-hint-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
            <p
              id="marketing-launch-pwa-hint-title"
              className="text-sm font-bold leading-snug text-white"
            >
              {copy.launchFromHomeHint}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setLaunchHintOpen(false)}
                className="min-h-12 flex-1 rounded-xl border border-white/20 text-sm font-bold text-white active:scale-95"
              >
                {copy.launchFromHomeGotIt}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLaunchHintOpen(false);
                  openPwaAppEntry();
                }}
                className="min-h-12 flex-1 rounded-xl bg-yellow-500 text-sm font-black text-black active:scale-95"
              >
                Continue in browser
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
