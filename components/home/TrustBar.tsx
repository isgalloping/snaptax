"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { homeVisual } from "@/lib/ui/homeVisual";

interface TrustBarProps {
  onLearnMore?: () => void;
}

export function TrustBar({ onLearnMore }: TrustBarProps) {
  const copy = useUserCopy().home.trustBar;
  const { trustBar } = homeVisual;

  return (
    <div
      className="shrink-0 border-t bg-black px-4 pb-1 pt-1"
      style={{ borderColor: trustBar.divider }}
    >
      <div className="flex min-h-11 items-center gap-2">
        <span
          className="shrink-0 text-sm leading-none text-green-400/90"
          aria-hidden
        >
          🛡
        </span>
        <p className="min-w-0 flex-1 line-clamp-2 text-[10px] font-medium leading-[1.2] text-zinc-400">
          {copy.message}
        </p>
        {onLearnMore ? (
          <button
            type="button"
            onClick={onLearnMore}
            className="-mr-1 flex shrink-0 items-center self-stretch px-2 text-[10px] font-bold text-green-400/90 transition-transform active:scale-95"
          >
            {copy.learnMore} &gt;
          </button>
        ) : null}
      </div>
    </div>
  );
}
