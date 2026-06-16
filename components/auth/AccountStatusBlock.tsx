"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { GoogleUser } from "@/lib/client/authStorage";

interface AccountStatusBlockProps {
  googleUser: GoogleUser | null;
  seasonPaid: boolean;
  seasonLabel: string;
  authHydrated?: boolean;
  onSignIn: () => void;
  onSignOut?: () => void;
}

export function AccountStatusBlock({
  googleUser,
  seasonPaid,
  seasonLabel,
  authHydrated = true,
  onSignIn,
  onSignOut,
}: AccountStatusBlockProps) {
  const copy = useUserCopy().settings.account;

  return (
    <section className="mb-8 rounded-xl border-2 border-zinc-600 bg-zinc-800 p-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
        {copy.title}
      </h2>
      {!authHydrated ? (
        <div className="mt-2 min-h-[4.5rem]" aria-busy="true" aria-live="polite" />
      ) : googleUser ? (
        <>
          <p className="mt-2 text-sm font-bold text-green-400">
            {copy.signedInPrefix} · {googleUser.email} · {copy.cloudBackupOn}
          </p>
          {seasonPaid && (
            <p className="mt-2 text-sm font-bold text-yellow-400">
              {seasonLabel} {copy.taxSeasonPaid}
            </p>
          )}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="mt-4 w-full min-h-16 rounded-xl border-2 border-zinc-600 bg-zinc-900 py-3 text-sm font-black uppercase tracking-wider text-white transition-transform active:scale-95"
            >
              {copy.signOut}
            </button>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 text-sm font-bold text-yellow-400">
            {copy.notSignedIn}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {copy.backupHint}
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="mt-4 w-full min-h-16 rounded-xl border-2 border-yellow-500 bg-yellow-950 py-3 text-sm font-black uppercase tracking-wider text-yellow-400 transition-transform active:scale-95"
          >
            {copy.googleCta}
          </button>
        </>
      )}
    </section>
  );
}
