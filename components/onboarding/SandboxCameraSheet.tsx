"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";

const SAMPLE_IMAGE = "/onboarding/sample-home-depot.png";

interface SandboxCameraSheetProps {
  onComplete: () => void;
}

export function SandboxCameraSheet({ onComplete }: SandboxCameraSheetProps) {
  const copy = useUserCopy().onboarding.aha;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div
        className="relative min-h-0 flex-1 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${SAMPLE_IMAGE})` }}
      >
        <div className="absolute inset-0 bg-black/30" aria-hidden />
      </div>

      <div className="flex shrink-0 flex-col items-center bg-black px-6 pb-10 pt-6">
        <button
          type="button"
          onClick={onComplete}
          aria-label={copy.sandboxShutterAria}
          className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-yellow-500 bg-yellow-500/20 transition-transform active:scale-95"
        >
          <span className="h-20 w-20 rounded-full bg-yellow-500" />
        </button>
      </div>
    </div>
  );
}
