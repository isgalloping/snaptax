"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { logFounderEvent } from "@/lib/founder/logFounderEvent";
import { homeVisual } from "@/lib/ui/homeVisual";

interface FounderProgramWidgetProps {
  onOpen: () => void;
  showNewBadge: boolean;
}

export function FounderProgramWidget({ onOpen, showNewBadge }: FounderProgramWidgetProps) {
  const copy = useUserCopy().home.widgets.founder;
  const visual = homeVisual.widgets.founder;
  const card = homeVisual.widgetPager.cardBase;

  const handleOpen = () => {
    logFounderEvent("founder_widget_tap");
    onOpen();
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      aria-label={`${copy.label}. ${copy.subtitle}`}
      className={`${card} flex min-h-16 flex-col ${visual.bg} ${visual.border} text-left transition-transform active:scale-[0.98]`}
    >
      <div className="flex items-center gap-1.5">
        <span aria-hidden>👑</span>
        {showNewBadge && (
          <span className="rounded bg-black px-1 py-0.5 text-[8px] font-black text-yellow-400">
            {copy.newBadge}
          </span>
        )}
        <p className={`text-xs font-semibold ${visual.accent}`}>{copy.label}</p>
      </div>
      <p className="mt-auto line-clamp-2 text-sm font-black leading-tight text-white">
        {copy.subtitle}
      </p>
      <span className="mt-0.5 text-[9px] font-bold text-zinc-300 underline decoration-zinc-600 underline-offset-2">
        {copy.view} &gt;
      </span>
    </button>
  );
}
