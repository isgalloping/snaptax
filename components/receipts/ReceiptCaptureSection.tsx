"use client";

import type { ReactNode } from "react";

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
  title = "Original Receipt Capture",
  imageSrc,
  imageMissing,
  imageOffline = false,
  hint = "Tap to zoom",
  onZoom,
  actions,
}: ReceiptCaptureSectionProps) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
        {title}
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
              alt="Receipt thumbnail"
              className="max-h-52 w-full object-contain"
            />
            <span className="pointer-events-none absolute bottom-2 right-2 z-[5] rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
              {hint}
            </span>
          </button>
          {actions}
        </div>
      ) : (
        <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950 px-4 text-center text-sm font-bold text-zinc-500">
          {imageOffline
            ? "Photo available when you're back online"
            : imageMissing
              ? "Photo not on this device"
              : "Loading photo…"}
        </div>
      )}
    </section>
  );
}
