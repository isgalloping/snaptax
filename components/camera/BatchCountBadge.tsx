"use client";

import { FooterActionTile } from "@/components/camera/FooterActionTile";
import { StackCardsIcon } from "@/components/icons/StackCardsIcon";
import { homeVisual } from "@/lib/ui/homeVisual";

interface BatchCountBadgeProps {
  count: number;
  latestId?: string;
  onPress?: (id: string) => void;
}

export function BatchCountBadge({
  count,
  latestId,
  onPress,
}: BatchCountBadgeProps) {
  if (count <= 0) {
    return <FooterActionTile placeholder aria-hidden>&nbsp;</FooterActionTile>;
  }

  const tile = (
    <FooterActionTile
      className={`gap-0.5 px-1 ${homeVisual.snapCamera.batchTileFill}`}
      onClick={
        latestId && onPress ? () => onPress(latestId) : undefined
      }
      ariaLabel="Review latest batch"
    >
      <div className="flex w-full flex-1 items-center justify-center gap-1">
        <StackCardsIcon className="h-7 w-7 shrink-0 text-green-400" />
        <span className="text-2xl font-black leading-none text-white">
          {count}
        </span>
      </div>
      <span className="text-[8px] font-bold uppercase leading-tight text-green-400">
        Batch {count}
      </span>
    </FooterActionTile>
  );

  return tile;
}
