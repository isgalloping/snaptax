"use client";

import { ExportEmptyTip } from "@/components/export/ExportEmptyTip";
import { useUserCopy } from "@/components/i18n/I18nProvider";

interface TaxExportSectionProps {
  currentSeason: string;
  seasonPaid: boolean;
  exportBusy?: boolean;
  exportEmptyTip?: string | null;
  exportEmptyTipKey?: number;
  onExportEmptyTipDismiss?: () => void;
  onRequestExport: () => void;
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 118 0v3" strokeLinecap="round" />
    </svg>
  );
}

export function TaxExportSection({
  currentSeason,
  seasonPaid,
  exportBusy = false,
  exportEmptyTip = null,
  exportEmptyTipKey = 0,
  onExportEmptyTipDismiss,
  onRequestExport,
}: TaxExportSectionProps) {
  const copy = useUserCopy().settings.export;

  const label = exportBusy
    ? copy.exporting
    : seasonPaid
      ? copy.buttonPaid
      : copy.buttonLocked.replace("{season}", currentSeason);

  return (
    <section className="mb-6">
      {exportEmptyTip && onExportEmptyTipDismiss && (
        <ExportEmptyTip
          key={exportEmptyTipKey}
          message={exportEmptyTip}
          onDismiss={onExportEmptyTipDismiss}
        />
      )}
      <button
        type="button"
        disabled={exportBusy}
        onClick={onRequestExport}
        className="flex w-full min-h-16 items-center justify-center gap-2 rounded-xl border-4 border-white bg-yellow-500 px-4 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-60"
      >
        {!exportBusy && !seasonPaid && <LockIcon />}
        <span>{label}</span>
      </button>
    </section>
  );
}
