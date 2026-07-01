"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { formatCurrency } from "@/lib/format";
import { homeVisual } from "@/lib/ui/homeVisual";
import { ReceiptIcon } from "@/components/icons/ReceiptIcon";
import { SlidersIcon } from "@/components/icons/SlidersIcon";
import { DownloadIcon } from "@/components/icons/DownloadIcon";
import { HomeScreenAddIcon } from "@/components/icons/HomeScreenAddIcon";
import { usePwaInstallOptional } from "@/components/pwa/pwaInstallContext";
import { CoachPulseOverlay } from "@/components/onboarding/CoachPulseOverlay";

interface TaxHeaderProps {
  taxSaved: number | null;
  totalExpenses: number;
  receiptCount: number;
  animating: boolean;
  onSettingsClick: () => void;
  onExportClick?: () => void;
  exportBusy?: boolean;
  exportError?: string | null;
  showSettings?: boolean;
  displayTaxSaved?: number | null;
  ahaCoachActive?: boolean;
  onAhaCoachDismiss?: () => void;
}

const actionBtn = homeVisual.headerActionBtn;

export function TaxHeader({
  taxSaved,
  totalExpenses,
  receiptCount,
  animating,
  onSettingsClick,
  onExportClick,
  exportBusy = false,
  exportError = null,
  showSettings = true,
  displayTaxSaved,
  ahaCoachActive = false,
  onAhaCoachDismiss,
}: TaxHeaderProps) {
  const pwaInstall = usePwaInstallOptional();
  const copy = useUserCopy().home.taxHeader;
  const showInstallButton = pwaInstall?.mode === "header-button";
  const headerTaxSaved = displayTaxSaved ?? taxSaved;
  const { heroCard } = homeVisual;

  const receiptLabel =
    receiptCount === 1
      ? `1 ${copy.receiptSingular}`
      : `${receiptCount} ${copy.receiptPlural}`;

  return (
    <header className={heroCard.shell}>
      <div
        className={`absolute inset-0 ${heroCard.image}`}
        style={{ backgroundImage: `url(${homeVisual.heroImage})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{ background: homeVisual.heroOverlay }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{ background: homeVisual.heroTint }}
        aria-hidden
      />
      <div className="relative z-10 flex items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0 flex-1 pr-2">
          <div
            className={`relative w-fit max-w-full ${ahaCoachActive ? "cursor-pointer rounded-xl px-2.5 py-2" : ""}`}
            role={ahaCoachActive ? "button" : undefined}
            tabIndex={ahaCoachActive ? 0 : undefined}
            onClick={ahaCoachActive ? onAhaCoachDismiss : undefined}
            onKeyDown={
              ahaCoachActive
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onAhaCoachDismiss?.();
                    }
                  }
                : undefined
            }
          >
            {ahaCoachActive && <CoachPulseOverlay />}
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-200">
              {copy.title}
            </p>
            <p
              className={`text-4xl font-black tracking-tight text-yellow-400 ${
                animating ? "animate-tax-bounce text-green-400" : ""
              }`}
              aria-live="polite"
              aria-atomic="true"
            >
              {headerTaxSaved === null ? "$- - -" : formatCurrency(headerTaxSaved)}
            </p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-bold text-zinc-300">
              <ReceiptIcon className="h-3 w-3 shrink-0" />
              <span>
                {receiptLabel} • {formatCurrency(totalExpenses)} {copy.tracked}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onExportClick && (
            <div className="relative">
              {ahaCoachActive && <CoachPulseOverlay variant="export" />}
              <button
                type="button"
                onClick={onExportClick}
                disabled={exportBusy}
                className={`${actionBtn} ${
                  ahaCoachActive
                    ? "relative border-yellow-400 ring-2 ring-black/70"
                    : "border-yellow-500/60"
                }`}
                aria-label={copy.cpaIrsReady}
                aria-busy={exportBusy}
              >
                <DownloadIcon
                  className={`h-5 w-5 text-yellow-400 ${exportBusy ? "animate-pulse" : ""}`}
                />
                <span className="mt-0.5 text-[9px] font-bold leading-none text-yellow-400/90">
                  CPA /IRS
                </span>
              </button>
            </div>
          )}
          {showInstallButton && pwaInstall && (
            <button
              type="button"
              onClick={() => void pwaInstall.install()}
              className={`${actionBtn} border-yellow-500/60`}
              aria-label={copy.installApp}
            >
              <HomeScreenAddIcon className="h-5 w-5 text-yellow-400" />
              <span className="mt-0.5 text-[9px] font-bold leading-none text-yellow-400/90">
                {copy.installShortLabel}
              </span>
            </button>
          )}
          {showSettings && (
            <button
              type="button"
              onClick={onSettingsClick}
              className={actionBtn}
              aria-label={copy.settings}
            >
              <SlidersIcon className="h-5 w-5 text-white" />
            </button>
          )}
        </div>
      </div>
      {exportError && (
        <p
          className="relative z-10 px-4 pb-2 text-center text-xs font-bold text-red-400"
          role="alert"
        >
          {exportError}
        </p>
      )}
    </header>
  );
}
