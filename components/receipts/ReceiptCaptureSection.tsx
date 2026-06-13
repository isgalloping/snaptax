"use client";

import type { ReactNode } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";

interface ReceiptCaptureSectionProps {
  title?: string;
  imageSrc: string | null;
  imageMissing: boolean;
  imageOffline?: boolean;
  hint?: string;
  onZoom: () => void;
  actions?: ReactNode;
}

export function ReceiptCaptureSection({
  title,
  imageSrc,
  imageMissing,
  imageOffline = false,
  hint,
  onZoom,
  actions,
}: ReceiptCaptureSectionProps) {
  const copy = useUserCopy().receiptDetail;
  const resolvedTitle = title ?? copy.originalCapture;
  const resolvedHint = hint ?? copy.tapToZoom;

  return (
    <section>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
        {resolvedTitle}
      </h3>
      {imageSrc ? (
        <div className="relative min-h-32 w-full overflow-hidden rounded-xl border border-zinc-600 bg-zinc-950">
          <button
            type="button"
            onClick={onZoom}
            className="relative block min-h-32 w-full active:scale-[0.99]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={copy.thumbnailAlt}
              className="max-h-52 w-full object-contain"
            />
            <span className="pointer-events-none absolute bottom-2 right-2 z-[5] rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
              {resolvedHint}
            </span>
          </button>
          {actions}
        </div>
      ) : (
        <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950 px-4 text-center text-sm font-bold text-zinc-500">
          {imageOffline
            ? copy.photoOffline
            : imageMissing
              ? copy.photoMissing
              : copy.loadingPhoto}
        </div>
      )}
    </section>
  );
}
