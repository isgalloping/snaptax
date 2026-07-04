"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { ContinueWithGoogleButton } from "@/components/auth/ContinueWithGoogleButton";
import type { GoogleUser } from "@/lib/client/authStorage";
import { maskEmailForDisplay } from "@/lib/client/maskEmail";
import { displayInitials } from "@/lib/user/displayInitials";
import { tierDisplayLabel } from "@/lib/founder/tiers";
import type { FounderTier } from "@/lib/founder/types";
import { seasonCoverageEndLabel } from "@/lib/settings/seasonCoverage";

interface SettingsAccountBlockProps {
  googleUser: GoogleUser | null;
  seasonPaid: boolean;
  seasonLabel: string;
  authHydrated?: boolean;
  founderStatus?: "none" | "active" | "lapsed";
  founderTier?: string | null;
  founderNumber?: number | null;
  onSignIn: () => void;
}

export function SettingsAccountBlock({
  googleUser,
  seasonPaid,
  seasonLabel,
  authHydrated = true,
  founderStatus = "none",
  founderTier = null,
  founderNumber = null,
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
        <p className="text-base font-black text-yellow-400 drop-shadow-md">
          {copy.notSignedIn}
        </p>
        <ContinueWithGoogleButton onClick={onSignIn} className="mt-4" />
      </div>
    );
  }

  const coverageDate = seasonCoverageEndLabel(seasonLabel);

  return (
    <div className="mb-6 flex items-center gap-4 transition-all duration-300">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-lg font-black text-black">
        {displayInitials(googleUser.name, googleUser.email)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-black text-white">{googleUser.name}</p>
        <p className="truncate text-sm font-bold text-zinc-400">
          {maskEmailForDisplay(googleUser.email)}
        </p>
        {founderStatus === "active" && founderNumber != null && (
          <p className="text-sm font-bold text-yellow-400">
            👑 {tierDisplayLabel((founderTier ?? "DEFAULT") as FounderTier)} #{founderNumber}
          </p>
        )}
        {seasonPaid && (
          <>
            <p className="text-sm font-bold text-yellow-400">
              {seasonLabel} {copy.taxSeasonPaid}
            </p>
            <p className="text-xs font-bold text-zinc-500">
              {copy.coverageEnds.replace("{date}", coverageDate)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
