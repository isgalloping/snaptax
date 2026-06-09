"use client";

import { homeVisual } from "@/lib/ui/homeVisual";

interface FlashDoneButtonProps {
  disabled?: boolean;
  onClick: () => void;
}

export function FlashDoneButton({ disabled = false, onClick }: FlashDoneButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Flash done"
      className={`flex min-h-14 min-w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-xl px-1 ${homeVisual.snapCamera.flashDoneFill} transition-transform active:scale-95 disabled:opacity-40`}
    >
      <span className="text-lg font-black text-black" aria-hidden>
        ⚡
      </span>
      <span className="text-[8px] font-black uppercase leading-tight text-black">
        Flash
        <br />
        Done
      </span>
    </button>
  );
}
