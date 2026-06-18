"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { homeVisual } from "@/lib/ui/homeVisual";

interface CpaReadyWidgetProps {
  count: number;
  onExport: () => void;
}

export function CpaReadyWidget({ count, onExport }: CpaReadyWidgetProps) {
  const copy = useUserCopy().home.widgets.cpa;
  const visual = homeVisual.widgets.cpa;
  const card = homeVisual.widgetPager.cardBase;

  return (
    <button
      type="button"
      onClick={onExport}
      className={`${card} flex flex-col ${visual.bg} ${visual.border} text-left transition-transform active:scale-[0.98]`}
      role="listitem"
    >
      <p className={`text-[9px] font-bold uppercase tracking-wider leading-none ${visual.accent}`}>
        {copy.label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-black leading-tight text-white">
        {copy.receiptsOrganized.replace("{count}", String(count))}
      </p>
      <span className="mt-auto text-[9px] font-bold text-zinc-300 underline decoration-zinc-600 underline-offset-2">
        {copy.export} &gt;
      </span>
    </button>
  );
}
