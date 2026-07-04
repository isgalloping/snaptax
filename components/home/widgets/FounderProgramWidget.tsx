"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { logFounderEvent } from "@/lib/founder/logFounderEvent";
import { isFounderScarcityUrgent } from "@/lib/founder/types";
import { formatCurrency } from "@/lib/format";
import { homeVisual } from "@/lib/ui/homeVisual";

export type FounderWidgetPreview = {
  priceUsd: number;
  remaining: number;
};

interface FounderProgramWidgetProps {
  onOpen: () => void;
  showNewBadge: boolean;
  preview?: FounderWidgetPreview | null;
}

export function FounderProgramWidget({
  onOpen,
  showNewBadge,
  preview,
}: FounderProgramWidgetProps) {
  const copy = useUserCopy().home.widgets.founder;
  const visual = homeVisual.widgets.founder;
  const card = homeVisual.widgetPager.cardBase;

  const priceLine =
    preview != null
      ? copy.subtitle.replace("{price}", formatCurrency(preview.priceUsd))
      : copy.subtitleLoading;

  const scarcityLine =
    preview != null && preview.remaining > 0
      ? copy.scarcity.replace("{remaining}", String(preview.remaining))
      : null;

  const scarcityUrgent =
    preview != null && isFounderScarcityUrgent(preview.remaining);

  const handleOpen = () => {
    logFounderEvent("founder_widget_tap");
    onOpen();
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      aria-label={`${copy.label}. ${priceLine}${scarcityLine ? `. ${scarcityLine}` : ""}. ${copy.view}`}
      className={`${card} flex ${visual.bg} ${visual.border} text-left transition-transform active:scale-[0.98]`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span aria-hidden>👑</span>
            <p
              className={`text-[9px] font-bold uppercase tracking-wider leading-none ${visual.accent}`}
            >
              {copy.label}
            </p>
            {showNewBadge && (
              <span className="rounded bg-black px-1 py-0.5 text-[8px] font-black text-yellow-400">
                {copy.newBadge}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-black leading-tight text-white">
            {priceLine}
          </p>
          {scarcityLine && (
            <p
              className={`mt-0.5 text-[9px] font-bold leading-tight ${
                scarcityUrgent ? "text-red-400" : "text-zinc-400"
              }`}
            >
              {scarcityLine}
            </p>
          )}
        </div>
        <span
          className="shrink-0 pt-0.5 text-sm font-bold text-zinc-400"
          aria-hidden
        >
          &gt;
        </span>
      </div>
    </button>
  );
}
