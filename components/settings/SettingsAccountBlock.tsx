"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { GoogleUser } from "@/lib/client/authStorage";
import { displayInitials } from "@/lib/user/displayInitials";

interface SettingsAccountBlockProps {
  googleUser: GoogleUser | null;
  seasonPaid: boolean;
  seasonLabel: string;
  authHydrated?: boolean;
  onSignIn: () => void;
}

export function SettingsAccountBlock({
  googleUser,
  seasonPaid,
  seasonLabel,
  authHydrated = true,
  onSignIn,
}: SettingsAccountBlockProps) {
  const copy = useUserCopy().settings.account;

  if (!authHydrated) {
    return (
      <div
        className="mb-6 min-h-[4.5rem] animate-pulse rounded-xl bg-zinc-800/60"
        aria-busy="true"
        aria-live="polite"
      />
    );
  }

  if (!googleUser) {
    return (
      <div className="mb-6">
        <p className="text-base font-black text-yellow-400">{copy.notSignedIn}</p>
        <button
          type="button"
          onClick={onSignIn}
          className="mt-4 flex w-full min-h-16 items-center justify-center rounded-xl border-4 border-white bg-yellow-500 px-4 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95"
        >
          {copy.googleCta}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center gap-4 transition-all duration-300">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-lg font-black text-black">
        {displayInitials(googleUser.name, googleUser.email)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-black text-white">{googleUser.name}</p>
        {seasonPaid && (
          <p className="text-sm font-bold text-yellow-400">
            {seasonLabel} {copy.taxSeasonPaid}
          </p>
        )}
      </div>
    </div>
  );
}
