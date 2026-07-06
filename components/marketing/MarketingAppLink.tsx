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
import { readPwaInstalledLocally } from "@/lib/pwa/installedDetect";
import { getInstallPlatform } from "@/lib/pwa/installPlatform";

type MarketingAppLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>;

function shouldShowIosInstalledHint(): boolean {
  return (
    getInstallPlatform() === "ios-safari" && readPwaInstalledLocally()
  );
}

/**
 * Marketing CTA to `/app` — synchronous full navigation on click so Android
 * WebAPK / Navigation Capturing can launch the installed app (user gesture).
 */
export function MarketingAppLink({
  onClick,
  children,
  ...rest
}: MarketingAppLinkProps) {
  const copy = useUserCopy().pwa;
  const [iosHintOpen, setIosHintOpen] = useState(false);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;

      event.preventDefault();

      if (shouldShowIosInstalledHint()) {
        setIosHintOpen(true);
        return;
      }

      openPwaAppEntry();
    },
    [onClick],
  );

  return (
    <>
      <a href={PWA_APP_ENTRY} onClick={handleClick} {...rest}>
        {children}
      </a>
      {iosHintOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="marketing-ios-pwa-hint-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
            <p
              id="marketing-ios-pwa-hint-title"
              className="text-sm font-bold leading-snug text-white"
            >
              {copy.launchFromHomeHint}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setIosHintOpen(false)}
                className="min-h-12 flex-1 rounded-xl border border-white/20 text-sm font-bold text-white active:scale-95"
              >
                {copy.launchFromHomeGotIt}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIosHintOpen(false);
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
