"use client";

import { useEffect, useState } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { readPwaInstalledLocally } from "@/lib/pwa/installedDetect";
import { readAppEntryGateDismissed } from "@/lib/pwa/appBrowserEntry";
import { isStandaloneDisplayMode } from "@/lib/pwa/deferredInstall";
import { getInstallPlatform } from "@/lib/pwa/installPlatform";

const LAUNCH_HINT_DISMISSED_KEY = "snap1099_launch_from_home_hint_dismissed";

function shouldShowLaunchFromHomeHint(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandaloneDisplayMode()) return false;
  if (getInstallPlatform() !== "chromium-android") return false;
  if (!readPwaInstalledLocally()) return false;
  if (readAppEntryGateDismissed()) return false;
  try {
    return sessionStorage.getItem(LAUNCH_HINT_DISMISSED_KEY) !== "1";
  } catch {
    return true;
  }
}

export function LaunchFromHomeHint() {
  const copy = useUserCopy().pwa;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowLaunchFromHomeHint());
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(LAUNCH_HINT_DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[55] border-t-4 border-yellow-500 bg-zinc-900 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="status"
    >
      <p className="text-sm font-bold leading-snug text-white">
        {copy.launchFromHomeHint}
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="mt-3 min-h-12 w-full rounded-xl bg-yellow-500 text-sm font-black uppercase tracking-wide text-black active:scale-95"
      >
        {copy.launchFromHomeGotIt}
      </button>
    </div>
  );
}
