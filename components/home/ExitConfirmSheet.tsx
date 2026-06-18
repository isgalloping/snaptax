"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";

interface ExitConfirmSheetProps {
  open: boolean;
  onStay: () => void;
  onExit: () => void;
}

export function ExitConfirmSheet({
  open,
  onStay,
  onExit,
}: ExitConfirmSheetProps) {
  const copy = useUserCopy().home.exitConfirm;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end bg-black/70"
      onClick={onStay}
      role="presentation"
    >
      <div
        className="w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 px-6 pb-10 pt-6"
        role="dialog"
        aria-labelledby="exit-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="exit-confirm-title"
          className="text-lg font-black uppercase tracking-wider text-white"
        >
          {copy.title}
        </h2>
        <p className="mt-2 text-sm font-bold text-zinc-400">{copy.body}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onStay}
            className="min-h-16 flex-1 rounded-xl bg-yellow-500 text-sm font-black uppercase tracking-wider text-black active:scale-95"
          >
            {copy.stay}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="min-h-16 flex-1 rounded-xl border-2 border-zinc-600 bg-zinc-800 text-sm font-black uppercase tracking-wider text-white active:scale-95"
          >
            {copy.exit}
          </button>
        </div>
      </div>
    </div>
  );
}
