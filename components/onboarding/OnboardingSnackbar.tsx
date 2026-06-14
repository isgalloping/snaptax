"use client";

import { useEffect } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";

interface OnboardingSnackbarProps {
  onDismiss: () => void;
}

export function OnboardingSnackbar({ onDismiss }: OnboardingSnackbarProps) {
  const copy = useUserCopy().onboarding.aha;

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 3000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-6 left-4 right-4 z-50 rounded-xl border border-green-500/60 bg-zinc-900 px-4 py-4 shadow-lg shadow-green-500/20"
      role="status"
    >
      <p className="text-center text-sm font-black uppercase tracking-wide text-green-400">
        {copy.snackbar}
      </p>
    </div>
  );
}
