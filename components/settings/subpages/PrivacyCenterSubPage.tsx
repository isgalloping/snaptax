"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { SettingsSubPageShell } from "@/components/settings/SettingsSubPageShell";
import { PrivacyDataSection } from "@/components/settings/PrivacyDataSection";

const PRIVACY_ICONS = ["🔒", "🇺🇸", "🚫", "✋"] as const;

interface PrivacyCenterSubPageProps {
  onBack: () => void;
  isSignedIn: boolean;
  onAccountDeleted?: () => void;
}

export function PrivacyCenterSubPage({
  onBack,
  isSignedIn,
  onAccountDeleted,
}: PrivacyCenterSubPageProps) {
  const copy = useUserCopy().settings.privacyCenter;

  return (
    <SettingsSubPageShell
      title={copy.title}
      onBack={onBack}
      footer={
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-16 w-full items-center justify-center rounded-xl bg-yellow-500 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95"
        >
          {copy.gotIt}
        </button>
      }
    >
      <ul className="space-y-6">
        {copy.points.map((point, index) => (
          <li key={point.title} className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xl">
              {PRIVACY_ICONS[index] ?? "•"}
            </span>
            <div>
              <h2 className="text-base font-black text-white">{point.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{point.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <PrivacyDataSection
          isSignedIn={isSignedIn}
          onAccountDeleted={onAccountDeleted}
        />
      </div>
    </SettingsSubPageShell>
  );
}
