"use client";

import { FooterActionTile } from "@/components/camera/FooterActionTile";
import { homeVisual } from "@/lib/ui/homeVisual";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Camera");
  return (
    <FooterActionTile
      fill={fill}
      disabled={disabled}
      onClick={onClick}
      ariaLabel={t("doneReview")}
      className={`gap-0.5 px-0.5 ${homeVisual.snapCamera.reviewDoneFill}`}
    >
      <span className="text-xl font-black text-green-400" aria-hidden>
        ✓
      </span>
      <span className="text-[7px] font-bold uppercase leading-tight text-white">
        {t("doneReview")}
      </span>
    </FooterActionTile>
  );
}
