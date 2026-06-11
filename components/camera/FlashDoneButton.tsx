"use client";

import { FooterActionTile } from "@/components/camera/FooterActionTile";
import { homeVisual } from "@/lib/ui/homeVisual";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Camera");
  return (
    <FooterActionTile
      fill={fill}
      disabled={disabled}
      onClick={onClick}
      ariaLabel={t("flashDone")}
      className={`gap-0.5 px-0.5 ${homeVisual.snapCamera.flashDoneFill}`}
    >
      <span className="text-xl font-black text-black" aria-hidden>
        ⚡
      </span>
      <span className="text-[7px] font-black uppercase leading-tight text-black">
        {t("flashDone")}
      </span>
    </FooterActionTile>
  );
}
