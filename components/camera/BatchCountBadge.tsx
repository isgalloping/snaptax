"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
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
  const copy = useUserCopy().camera;
  if (count <= 0) {
    return (
      <FooterActionTile
        fill
        placeholder
        className={homeVisual.snapCamera.batchTileOutline}
      >
        &nbsp;
      </FooterActionTile>
    );
  }

  return (
    <FooterActionTile
      fill
      className={`relative justify-between py-1 ${homeVisual.snapCamera.batchTileOutline}`}
      onClick={latestId && onPress ? () => onPress(latestId) : undefined}
      ariaLabel={copy.batchReviewAria}
    >
      <StackCardsIcon className="absolute left-1 top-1 h-5 w-5 text-green-400" />
      <span className="flex flex-1 items-center justify-center text-2xl font-black leading-none text-white">
        {count}
      </span>
      <span className="pb-0.5 text-[7px] font-bold uppercase leading-none text-green-400">
        {copy.batchLabel.replace("{count}", String(count))}
      </span>
    </FooterActionTile>
  );
}
