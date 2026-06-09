"use client";

import { homeVisual } from "@/lib/ui/homeVisual";

interface ReviewDoneButtonProps {
  disabled?: boolean;
  onClick: () => void;
}

export function ReviewDoneButton({ disabled = false, onClick }: ReviewDoneButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Done and review"
      className={`flex min-h-14 min-w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-xl px-1 ${homeVisual.snapCamera.reviewDoneFill} transition-transform active:scale-95 disabled:opacity-40`}
    >
      <span className="text-lg font-black text-green-400" aria-hidden>
        ✓
      </span>
      <span className="text-[8px] font-bold uppercase leading-tight text-white">
        Done
        <br />&amp; Review
      </span>
    </button>
  );
}
