"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";

interface SnapCoachBannerProps {
  onDismiss: () => void;
}

export function SnapCoachBanner({ onDismiss }: SnapCoachBannerProps) {
  const copy = useUserCopy().onboarding;

  return (
    <div className="mt-2 flex items-start gap-2 border-l-4 border-yellow-500 bg-zinc-900 px-3 py-3">
      <p className="min-w-0 flex-1 text-sm font-bold leading-snug text-white">
        {copy.snapCoach}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-zinc-400 active:scale-95"
        aria-label={copy.dismissCoach}
      >
        ×
      </button>
    </div>
  );
}
