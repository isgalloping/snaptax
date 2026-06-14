"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";

interface OnboardingSkipButtonProps {
  onSkip: () => void | Promise<void>;
}

export function OnboardingSkipButton({ onSkip }: OnboardingSkipButtonProps) {
  const copy = useUserCopy().onboarding;

  return (
    <button
      type="button"
      onClick={() => void onSkip()}
      className="fixed bottom-4 left-4 z-[60] flex min-h-16 min-w-16 items-center justify-center pb-[env(safe-area-inset-bottom)] text-sm font-bold text-zinc-400 transition-transform active:scale-95"
      aria-label={copy.skipAria}
    >
      {copy.skip}
    </button>
  );
}
