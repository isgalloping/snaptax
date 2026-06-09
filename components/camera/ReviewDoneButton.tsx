"use client";

import { FooterActionTile } from "@/components/camera/FooterActionTile";
import { homeVisual } from "@/lib/ui/homeVisual";

interface ReviewDoneButtonProps {
  disabled?: boolean;
  onClick: () => void;
}

export function ReviewDoneButton({ disabled = false, onClick }: ReviewDoneButtonProps) {
  return (
    <FooterActionTile
      disabled={disabled}
      onClick={onClick}
      ariaLabel="Done and review"
      className={`gap-0.5 px-0.5 ${homeVisual.snapCamera.reviewDoneFill}`}
    >
      <span className="text-lg font-black text-green-400" aria-hidden>
        ✓
      </span>
      <span className="text-[8px] font-bold uppercase leading-tight text-white">
        Done
        <br />&amp; Review
      </span>
    </FooterActionTile>
  );
}
