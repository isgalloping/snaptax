"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { SettingsSubPageShell } from "@/components/settings/SettingsSubPageShell";

interface ExportCompletedPageProps {
  onViewStatus: () => void;
}

export function ExportCompletedPage({ onViewStatus }: ExportCompletedPageProps) {
  const copy = useUserCopy().settings.exportFlow;

  return (
    <SettingsSubPageShell title={copy.completedTitle} onBack={onViewStatus}>
      <div className="flex flex-col items-center py-12 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-green-500 bg-green-950/40 text-4xl"
          aria-hidden
        >
          ✓
        </div>
        <p className="mt-6 text-xl font-black uppercase tracking-wider text-white">
          {copy.completedTitle}
        </p>
        <button
          type="button"
          onClick={onViewStatus}
          className="mt-10 w-full min-h-16 rounded-xl bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95"
        >
          {copy.viewStatus}
        </button>
      </div>
    </SettingsSubPageShell>
  );
}
