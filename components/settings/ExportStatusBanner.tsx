"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";

interface ExportStatusBannerProps {
  variant: "sample-ready" | "export-blocked";
  onDownloadAgain?: () => void;
  onDismiss?: () => void;
}

export function ExportStatusBanner({
  variant,
  onDownloadAgain,
  onDismiss,
}: ExportStatusBannerProps) {
  const copy = useUserCopy().settings.exportBanners;

  if (variant === "export-blocked") {
    return (
      <div
        className="mb-4 flex items-start gap-3 rounded-xl border-2 border-red-700 bg-red-950/80 px-4 py-3"
        role="alert"
      >
        <span className="text-lg" aria-hidden>
          ⚠️
        </span>
        <p className="flex-1 text-sm font-bold leading-snug text-red-300">
          {copy.exportBlocked}
        </p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 text-xs font-bold uppercase text-red-400 transition-transform active:scale-95"
            aria-label={copy.dismiss}
          >
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border-2 border-green-700 bg-green-950/60 px-4 py-3">
      <p className="text-sm font-bold text-green-400">
        <span aria-hidden>✓ </span>
        {copy.sampleReady}
      </p>
      {onDownloadAgain && (
        <button
          type="button"
          onClick={onDownloadAgain}
          className="shrink-0 text-xs font-bold uppercase text-green-300 underline transition-transform active:scale-95"
        >
          {copy.downloadAgain}
        </button>
      )}
    </div>
  );
}
