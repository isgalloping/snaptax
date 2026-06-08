"use client";

import { homeVisual } from "@/lib/ui/homeVisual";

interface BatchCountBadgeProps {
  count: number;
  latestThumbUrl?: string;
}

export function BatchCountBadge({ count, latestThumbUrl }: BatchCountBadgeProps) {
  if (count <= 0) {
    return <div className="h-16 w-16 shrink-0" aria-hidden />;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative h-16 w-16 overflow-hidden rounded-xl bg-zinc-900/90 ${homeVisual.snapCamera.badgeGlow}`}
      >
        {latestThumbUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={latestThumbUrl}
            alt=""
            className="h-full w-full object-cover opacity-80"
          />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-2xl font-black text-white">
          {count}
        </span>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wide text-green-400">
        Batch {count}
      </span>
    </div>
  );
}
