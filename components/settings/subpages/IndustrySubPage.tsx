"use client";

import type { Industry } from "@/lib/types";
import { INDUSTRIES } from "@/lib/types";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { SettingsSubPageShell } from "@/components/settings/SettingsSubPageShell";

interface IndustrySubPageProps {
  industry: Industry | null;
  onIndustryChange: (industry: Industry) => void;
  onBack: () => void;
}

export function IndustrySubPage({
  industry,
  onIndustryChange,
  onBack,
}: IndustrySubPageProps) {
  const copy = useUserCopy().settings.industry;

  return (
    <SettingsSubPageShell title={copy.title} onBack={onBack}>
      <ul className="space-y-2">
        {INDUSTRIES.map((item) => {
          const selected = industry === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onIndustryChange(item.id)}
                className={`flex min-h-14 w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-transform active:scale-[0.99] ${
                  selected
                    ? "border-yellow-500 bg-yellow-950/40"
                    : "border-zinc-600 bg-zinc-800"
                }`}
              >
                <span className="text-sm font-bold text-white">
                  {copy.labels[item.id]}
                </span>
                {selected && (
                  <span className="text-lg font-black text-green-400" aria-hidden>
                    ✓
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </SettingsSubPageShell>
  );
}
