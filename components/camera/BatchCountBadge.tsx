"use client";

import { homeVisual } from "@/lib/ui/homeVisual";

interface BatchCountBadgeProps {
  count: number;
  latestThumbUrl?: string;
  latestId?: string;
  onPress?: (id: string) => void;
}

export function BatchCountBadge({
  count,
  latestThumbUrl,
  latestId,
  onPress,
}: BatchCountBadgeProps) {
  if (count <= 0) {
    return <div className="h-16 w-16 shrink-0" aria-hidden />;
  }

  const badge = (
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
  );

  return (
    <div className="flex flex-col items-center gap-1">
      {latestId && onPress ? (
        <button
          type="button"
          onClick={() => onPress(latestId)}
          className="transition-transform active:scale-95"
          aria-label="Review latest receipt photo"
        >
          {badge}
        </button>
      ) : (
        badge
      )}
      <span className="text-[10px] font-bold uppercase tracking-wide text-green-400">
        Batch {count}
      </span>
    </div>
  );
}
