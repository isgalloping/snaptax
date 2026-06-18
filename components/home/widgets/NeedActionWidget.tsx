"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { homeVisual } from "@/lib/ui/homeVisual";

interface NeedActionWidgetProps {
  blurryCount: number;
  onResnap: () => void;
}

export function NeedActionWidget({ blurryCount, onResnap }: NeedActionWidgetProps) {
  const copy = useUserCopy().home.widgets.needAction;
  const visual = homeVisual.widgets.needAction;
  const card = homeVisual.widgetPager.cardBase;

  return (
    <button
      type="button"
      onClick={onResnap}
      className={`${card} flex flex-col ${visual.bg} ${visual.border} text-left transition-transform active:scale-[0.98]`}
      role="listitem"
    >
      <p className={`text-[9px] font-bold uppercase tracking-wider leading-none ${visual.accent}`}>
        {copy.label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-black leading-tight text-white">
        {copy.blurryCount.replace("{count}", String(blurryCount))}
      </p>
      <span className="mt-auto text-[9px] font-bold text-red-300 underline decoration-red-600/60 underline-offset-2">
        {copy.resnap} &gt;
      </span>
    </button>
  );
}
