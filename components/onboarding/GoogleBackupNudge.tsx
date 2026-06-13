"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";

interface GoogleBackupNudgeProps {
  onSignInClick: () => void;
  onDismiss: () => void;
}

export function GoogleBackupNudge({
  onSignInClick,
  onDismiss,
}: GoogleBackupNudgeProps) {
  const copy = useUserCopy().onboarding;

  return (
    <div className="mt-2 border border-yellow-500/40 bg-zinc-900">
      <button
        type="button"
        onClick={onSignInClick}
        className="w-full px-3 py-3 text-left text-sm font-bold leading-snug text-white active:scale-[0.99]"
      >
        {copy.googleNudge}
      </button>
      <div className="flex justify-end border-t border-zinc-800 px-2 py-1">
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-11 px-3 text-xs font-bold text-zinc-400 active:scale-95"
        >
          {copy.googleNudgeDismiss}
        </button>
      </div>
    </div>
  );
}
