"use client";

import { ExportEmptyTip } from "@/components/export/ExportEmptyTip";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { resolveExportCardState } from "@/lib/settings/resolveExportCardState";
import { settingsVisual } from "@/lib/ui/settingsVisual";
import type { IncomeCaptureKind } from "@/lib/export/incomeCapture";
import { setPendingIncomeCapture } from "@/lib/export/incomeCapture";

interface TaxExportCardProps {
  currentSeason: string;
  isSignedIn: boolean;
  seasonPaid: boolean;
  hasSeasonExportDone: boolean;
  exportBusy?: boolean;
  exportEmptyTip?: string | null;
  exportEmptyTipKey?: number;
  onExportEmptyTipDismiss?: () => void;
  onRequestExport: () => void;
  onSnap1099?: (kind: IncomeCaptureKind) => void;
}

function LockIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/20">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-yellow-500"
        aria-hidden
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 118 0v3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function UnlockedIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/20">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-green-500"
        aria-hidden
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 118 0v3" strokeLinecap="round" />
        <path d="M12 15v2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function TaxExportCard({
  currentSeason,
  isSignedIn,
  seasonPaid,
  hasSeasonExportDone,
  exportBusy = false,
  exportEmptyTip = null,
  exportEmptyTipKey = 0,
  onExportEmptyTipDismiss,
  onRequestExport,
  onSnap1099,
}: TaxExportCardProps) {
  const copy = useUserCopy().settings;
  const cardCopy = copy.exportCard;
  const exportCopy = copy.export;

  const state = resolveExportCardState({
    isSignedIn,
    seasonPaid,
    currentSeason,
    hasSeasonExportDone,
  });

  const stateCopy = cardCopy.states[state];
  const title = stateCopy.title.replace("{season}", currentSeason);
  const showPricing = state === "anon" || state === "unpaid";
  const showUnlockedIcon = state === "paid_new" || state === "paid_exported" || state === "final_deadline";

  const ctaLabel = exportBusy ? exportCopy.exporting : stateCopy.cta;

  return (
    <section className="mb-6">
      {exportEmptyTip && onExportEmptyTipDismiss && (
        <ExportEmptyTip
          key={exportEmptyTipKey}
          message={exportEmptyTip}
          onDismiss={onExportEmptyTipDismiss}
        />
      )}
      <div className={settingsVisual.exportCard.container}>
        <div className="flex items-start gap-3">
          {showUnlockedIcon ? <UnlockedIcon /> : <LockIcon />}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-black uppercase tracking-wide text-white">
                {title}
              </p>
              {showPricing && (
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={settingsVisual.exportCard.badgePopular}>
                    {cardCopy.mostPopular}
                  </span>
                  <span className={settingsVisual.exportCard.price}>
                    {cardCopy.price}
                  </span>
                </div>
              )}
            </div>
            <p className={`mt-1 ${settingsVisual.exportCard.subtitleCompat}`}>
              {cardCopy.compatLine}
            </p>
            <p className={`mt-0.5 ${settingsVisual.exportCard.subtitleFormat}`}>
              {cardCopy.formatLine}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={exportBusy}
          onClick={onRequestExport}
          className="mt-4 flex w-full min-h-16 items-center justify-center rounded-xl bg-yellow-500 px-4 py-4 text-base font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-60"
        >
          {ctaLabel}
        </button>
        {onSnap1099 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={exportBusy}
              onClick={() => {
                setPendingIncomeCapture("1099-NEC");
                onSnap1099("1099-NEC");
              }}
              className="min-h-11 rounded-lg border border-yellow-500/60 bg-zinc-900 py-2 text-[10px] font-black uppercase tracking-wider text-yellow-400 transition-transform active:scale-95 disabled:opacity-50"
            >
              {cardCopy.snap1099Nec}
            </button>
            <button
              type="button"
              disabled={exportBusy}
              onClick={() => {
                setPendingIncomeCapture("1099-K");
                onSnap1099("1099-K");
              }}
              className="min-h-11 rounded-lg border border-zinc-600 bg-zinc-900 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-300 transition-transform active:scale-95 disabled:opacity-50"
            >
              {cardCopy.snap1099K}
            </button>
          </div>
        )}
        {showPricing && (
          <p className={settingsVisual.exportCard.trustFootnote}>
            ✓ {cardCopy.trustLine}
          </p>
        )}
        <p className="mt-3 text-center text-xs text-zinc-400">
          {cardCopy.taxEstimateDisclaimer}
        </p>
      </div>
    </section>
  );
}
