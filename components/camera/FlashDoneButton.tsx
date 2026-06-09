"use client";

import { FooterActionTile } from "@/components/camera/FooterActionTile";
import { homeVisual } from "@/lib/ui/homeVisual";

interface FlashDoneButtonProps {
  disabled?: boolean;
  onClick: () => void;
}

export function FlashDoneButton({ disabled = false, onClick }: FlashDoneButtonProps) {
  return (
    <FooterActionTile
      disabled={disabled}
      onClick={onClick}
      ariaLabel="Flash done"
      className={`gap-0.5 px-0.5 ${homeVisual.snapCamera.flashDoneFill}`}
    >
      <span className="text-lg font-black text-black" aria-hidden>
        ⚡
      </span>
      <span className="text-[8px] font-black uppercase leading-tight text-black">
        Flash
        <br />
        Done
      </span>
    </FooterActionTile>
  );
}
