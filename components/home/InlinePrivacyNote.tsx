"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";

interface InlinePrivacyNoteProps {
  onLearnMore?: () => void;
}

export function InlinePrivacyNote({ onLearnMore }: InlinePrivacyNoteProps) {
  const copy = useUserCopy().home.trustBar;

  return (
    <div className="mx-4 mb-2 flex items-center justify-between gap-2 text-[10px] font-medium leading-snug text-zinc-400">
      <p className="min-w-0 flex-1">
        <span className="text-green-400/90" aria-hidden>
          🛡{" "}
        </span>
        {copy.message}
      </p>
      {onLearnMore ? (
        <button
          type="button"
          onClick={onLearnMore}
          className="shrink-0 font-bold text-green-400/90 transition-transform active:scale-95"
        >
          {copy.learnMore} &gt;
        </button>
      ) : null}
    </div>
  );
}
