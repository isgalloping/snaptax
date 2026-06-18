"use client";

import type { ReactNode } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { homeVisual } from "@/lib/ui/homeVisual";

interface ReceiptCaptureActionsProps {
  showResnap?: boolean;
  showDelete?: boolean;
  busy?: boolean;
  onDelete: () => void;
  onResnap?: () => void;
}

export function ReceiptCaptureActions({
  showResnap = true,
  showDelete = true,
  busy = false,
  onDelete,
  onResnap,
}: ReceiptCaptureActionsProps) {
  const copy = useUserCopy().receiptDetail;
  const { size, deleteSize, delete: deleteCls, resnap } = homeVisual.reviewControl;

  const btn = (
    label: string,
    ariaLabel: string,
    className: string,
    icon: ReactNode,
    onClick: () => void,
    dimensionClass: string = size,
  ) => (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        disabled={busy}
        aria-label={ariaLabel}
        className={`flex ${dimensionClass} items-center justify-center transition-transform active:scale-95 disabled:opacity-40 ${className}`}
      >
        {icon}
      </button>
      <span className="text-[10px] font-bold uppercase tracking-wide text-white drop-shadow-md">
        {label}
      </span>
    </div>
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-8 bg-black/25"
    >
      <div className="pointer-events-auto flex items-center justify-center gap-8">
        {showDelete &&
          btn(
            copy.delete,
            copy.deleteReceipt,
            deleteCls,
            <span className="text-2xl text-white" aria-hidden>
              🗑
            </span>,
            onDelete,
            deleteSize,
          )}
        {showResnap &&
          onResnap &&
          btn(
            copy.resnap,
            copy.resnapReceipt,
            resnap,
            <span className="text-2xl font-black text-white" aria-hidden>
              ✕
            </span>,
            onResnap,
          )}
      </div>
    </div>
  );
}
