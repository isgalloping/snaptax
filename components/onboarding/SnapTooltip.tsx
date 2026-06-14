"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";

export function SnapTooltip() {
  const copy = useUserCopy().onboarding.aha;

  return (
    <div
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 w-[min(100%,18rem)] -translate-x-1/2"
      role="status"
    >
      <div className="rounded-xl border-2 border-yellow-500 bg-zinc-900 px-4 py-3 shadow-lg shadow-yellow-500/20">
        <p className="text-center text-sm font-bold leading-snug text-white">
          {copy.snapTooltip}
        </p>
      </div>
      <div
        className="mx-auto h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-yellow-500"
        aria-hidden
      />
    </div>
  );
}
