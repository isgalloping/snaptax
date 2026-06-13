"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
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
  const copy = useUserCopy().camera;
  return (
    <FooterActionTile
      fill={fill}
      disabled={disabled}
      onClick={onClick}
      ariaLabel={copy.doneReviewAria}
      className={`gap-0.5 px-0.5 ${homeVisual.snapCamera.reviewDoneFill}`}
    >
      <span className="text-xl font-black text-green-400" aria-hidden>
        ✓
      </span>
      <span className="text-[7px] font-bold uppercase leading-tight text-white">
        {copy.doneReviewLine1}
        <br />&amp; {copy.doneReviewLine2}
      </span>
    </FooterActionTile>
  );
}
