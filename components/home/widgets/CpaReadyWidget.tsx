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

  return (
    <div
      className={`rounded-2xl border p-4 ${visual.bg} ${visual.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${visual.accent}`}>
            {copy.label}
          </p>
          <p className="mt-1 text-2xl font-black text-white">
            {copy.receiptsOrganized.replace("{count}", String(count))}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            onClick={onExport}
            className="min-h-11 rounded-xl border-2 border-orange-500 bg-orange-600 px-4 text-sm font-black uppercase tracking-wide text-white transition-transform active:scale-95"
          >
            {copy.export}
          </button>
          <p className="text-[10px] font-medium text-zinc-400">{copy.subcopy}</p>
        </div>
      </div>
    </div>
  );
}
