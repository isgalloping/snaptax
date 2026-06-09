"use client";

import { FooterActionTile } from "@/components/camera/FooterActionTile";
import { homeVisual } from "@/lib/ui/homeVisual";

interface ReviewDoneButtonProps {
  disabled?: boolean;
  onClick: () => void;
  fill?: boolean;
}

export function ReviewDoneButton({
  disabled = false,
  onClick,
  fill = true,
}: ReviewDoneButtonProps) {
  return (
    <FooterActionTile
      fill={fill}
      disabled={disabled}
      onClick={onClick}
      ariaLabel="Done and review"
      className={`gap-0.5 px-0.5 ${homeVisual.snapCamera.reviewDoneFill}`}
    >
      <span className="text-xl font-black text-green-400" aria-hidden>
        ✓
      </span>
      <span className="text-[7px] font-bold uppercase leading-tight text-white">
        Done
        <br />&amp; Review
      </span>
    </FooterActionTile>
  );
}
