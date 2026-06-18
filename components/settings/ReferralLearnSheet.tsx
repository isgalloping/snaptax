"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";

interface ReferralLearnSheetProps {
  onClose: () => void;
}

export function ReferralLearnSheet({ onClose }: ReferralLearnSheetProps) {
  const copy = useUserCopy().settings.share;
  const gotIt = useUserCopy().settings.privacyCenter.gotIt;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10">
        <p className="text-lg font-black uppercase tracking-wider text-white">
          {copy.learnSheetTitle}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">
          {copy.learnSheetBody}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full min-h-16 rounded-xl bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95"
        >
          {gotIt}
        </button>
      </div>
    </div>
  );
}
