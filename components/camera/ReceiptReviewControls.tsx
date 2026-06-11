"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { homeVisual } from "@/lib/ui/homeVisual";

interface ReceiptReviewControlsProps {
  onDelete: () => void;
  onResnap: () => void;
  onAccept: () => void;
  busy?: boolean;
}

export function ReceiptReviewControls({
  onDelete,
  onResnap,
  onAccept,
  busy = false,
}: ReceiptReviewControlsProps) {
  const tCommon = useTranslations("Common");
  const tDetail = useTranslations("ReceiptDetail");
  const { size, delete: deleteCls, resnap, accept } = homeVisual.reviewControl;

  const action = (
    label: string,
    ariaLabel: string,
    className: string,
    icon: ReactNode,
    onClick: () => void,
  ) => (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-label={ariaLabel}
        className={`flex ${size} items-center justify-center transition-transform active:scale-95 disabled:opacity-40 ${className}`}
      >
        {icon}
      </button>
      <span className="text-[10px] font-bold uppercase tracking-wide text-white">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex items-end justify-between gap-2 px-6 pb-3 pt-2">
      {action(
        tCommon("delete"),
        "Delete receipt from batch",
        deleteCls,
        <span className="text-xl text-white" aria-hidden>
          🗑
        </span>,
        onDelete,
      )}
      {action(
        tDetail("resnap"),
        "Resnap receipt",
        resnap,
        <span className="text-2xl font-black text-white" aria-hidden>
          ✕
        </span>,
        onResnap,
      )}
      {action(
        tCommon("done"),
        "Accept receipt",
        accept,
        <span className="text-2xl font-black text-white" aria-hidden>
          ✓
        </span>,
        onAccept,
      )}
    </div>
  );
}
