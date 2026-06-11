"use client";

import { useTranslations } from "next-intl";
import type { GoogleUser } from "@/lib/client/authStorage";

interface AccountStatusBlockProps {
  googleUser: GoogleUser | null;
  seasonPaid: boolean;
  seasonLabel: string;
  onSignIn: () => void;
}

export function AccountStatusBlock({
  googleUser,
  seasonPaid,
  seasonLabel,
  onSignIn,
}: AccountStatusBlockProps) {
  const t = useTranslations("Auth");

  return (
    <section className="mb-8 rounded-xl border-2 border-zinc-600 bg-zinc-800 p-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
        {t("account")}
      </h2>
      {googleUser ? (
        <>
          <p className="mt-2 text-sm font-bold text-green-400">
            {t("signedIn")} · {googleUser.email} · {t("cloudBackupOn")}
          </p>
          {seasonPaid && (
            <p className="mt-2 text-sm font-bold text-yellow-400">
              {seasonLabel} Tax Season · Paid ✓
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 text-sm font-bold text-yellow-400">
            {t("notSignedIn")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {t("signInToSync")}
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="mt-4 w-full min-h-16 rounded-xl border-2 border-yellow-500 bg-yellow-950 py-3 text-sm font-black uppercase tracking-wider text-yellow-400 transition-transform active:scale-95"
          >
            {t("continueWithGoogle")}
          </button>
        </>
      )}
    </section>
  );
}
