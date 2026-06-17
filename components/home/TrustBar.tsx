"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { homeVisual } from "@/lib/ui/homeVisual";

interface TrustBarProps {
  onLearnMore: () => void;
}

export function TrustBar({ onLearnMore }: TrustBarProps) {
  const copy = useUserCopy().home.trustBar;
  const { trustBar } = homeVisual;

  return (
    <div className="shrink-0 px-4 pb-2">
      <div
        className={`flex items-center gap-3 ${trustBar.radius} border px-3 py-2.5`}
        style={{ backgroundColor: trustBar.bg, borderColor: trustBar.border }}
      >
        <span className="text-lg text-green-400" aria-hidden>
          🛡
        </span>
        <p className="min-w-0 flex-1 text-xs font-medium leading-snug text-zinc-200">
          {copy.message}
        </p>
        <button
          type="button"
          onClick={onLearnMore}
          className="shrink-0 min-h-11 px-2 text-xs font-bold text-green-400 transition-transform active:scale-95"
        >
          {copy.learnMore} &gt;
        </button>
      </div>
    </div>
  );
}
