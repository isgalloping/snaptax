"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { HomeScreenAddIcon } from "@/components/icons/HomeScreenAddIcon";
import { usePwaInstallOptional } from "@/components/pwa/pwaInstallContext";

export function MarketingInstallButton() {
  const copy = useUserCopy().home.taxHeader;
  const pwaInstall = usePwaInstallOptional();

  if (!pwaInstall || pwaInstall.mode === "none") return null;

  return (
    <button
      type="button"
      onClick={() => void pwaInstall.install()}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-yellow-500/50 px-3 text-sm font-bold text-yellow-400 transition-transform active:scale-95"
      aria-label={copy.installApp}
    >
      <HomeScreenAddIcon className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline">{copy.installShortLabel}</span>
    </button>
  );
}
