"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { FooterActionTile } from "@/components/camera/FooterActionTile";
import { homeVisual } from "@/lib/ui/homeVisual";

interface FlashDoneButtonProps {
  disabled?: boolean;
  onClick: () => void;
  fill?: boolean;
}

export function FlashDoneButton({
  disabled = false,
  onClick,
  fill = true,
}: FlashDoneButtonProps) {
  const copy = useUserCopy().camera;
  return (
    <FooterActionTile
      fill={fill}
      disabled={disabled}
      onClick={onClick}
      ariaLabel={copy.flashDoneAria}
      className={`gap-0.5 px-0.5 ${homeVisual.snapCamera.flashDoneFill}`}
    >
      <span className="text-xl font-black text-black" aria-hidden>
        ⚡
      </span>
      <span className="text-[7px] font-black uppercase leading-tight text-black">
        {copy.flashDoneLine1}
        <br />
        {copy.flashDoneLine2}
      </span>
    </FooterActionTile>
  );
}
