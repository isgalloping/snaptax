"use client";

import { formatCurrency } from "@/lib/format";
import { homeVisual } from "@/lib/ui/homeVisual";
import { ReceiptIcon } from "@/components/icons/ReceiptIcon";
import { SlidersIcon } from "@/components/icons/SlidersIcon";
import { RefreshIcon } from "@/components/icons/RefreshIcon";
import { DownloadIcon } from "@/components/icons/DownloadIcon";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { usePwaInstallOptional } from "@/components/pwa/pwaInstallContext";

interface TaxHeaderProps {
  taxSaved: number | null;
  totalExpenses: number;
  receiptCount: number;
  animating: boolean;
  onSettingsClick: () => void;
  onSyncClick?: () => void;
  syncing?: boolean;
  syncDisabled?: boolean;
  showSettings?: boolean;
}

const actionBtn =
  "flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-black/40 transition-transform active:scale-95 disabled:opacity-40";

export function TaxHeader({
  taxSaved,
  totalExpenses,
  receiptCount,
  animating,
  onSettingsClick,
  onSyncClick,
  syncing = false,
  syncDisabled = false,
  showSettings = true,
}: TaxHeaderProps) {
  const copy = useUserCopy();
  const pwaInstall = usePwaInstallOptional();
  const showInstallButton = pwaInstall?.mode === "header-button";

  const receiptLabel =
    receiptCount === 1
      ? `1 ${copy.home.taxHeader.receiptSingular}`
      : `${receiptCount} ${copy.home.taxHeader.receiptPlural}`;

  return (
    <header className="relative min-h-[132px] max-h-[24vh] shrink-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-[85%_center] bg-no-repeat"
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
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <div className="min-w-0 flex-1 pr-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-200">
            {copy.home.taxHeader.title}
          </p>
          <p
            className={`text-4xl font-black tracking-tight text-yellow-400 ${
              animating ? "animate-tax-bounce text-green-400" : ""
            }`}
          >
            {taxSaved === null ? "$- - -" : formatCurrency(taxSaved)}
          </p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-bold text-zinc-300">
            <ReceiptIcon className="h-3 w-3 shrink-0" />
            <span>
              {receiptLabel} • {formatCurrency(totalExpenses)}{" "}
              {copy.home.taxHeader.tracked}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showInstallButton && pwaInstall && (
            <button
              type="button"
              onClick={() => void pwaInstall.install()}
              className={`${actionBtn} border-yellow-500/60`}
              aria-label={copy.home.taxHeader.installApp}
            >
              <DownloadIcon className="h-5 w-5 text-yellow-400" />
            </button>
          )}
          {onSyncClick && (
            <button
              type="button"
              onClick={onSyncClick}
              disabled={syncDisabled || syncing}
              className={actionBtn}
              aria-label={copy.home.taxHeader.syncReceipts}
            >
              <RefreshIcon
                className={`h-5 w-5 text-white ${syncing ? "animate-spin" : ""}`}
              />
            </button>
          )}
          {showSettings && (
            <button
              type="button"
              onClick={onSettingsClick}
              className={actionBtn}
              aria-label={copy.home.taxHeader.settings}
            >
              <SlidersIcon className="h-5 w-5 text-white" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
