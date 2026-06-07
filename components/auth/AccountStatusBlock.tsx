"use client";

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
  return (
    <section className="mb-8 rounded-xl border-2 border-zinc-600 bg-zinc-800 p-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
        Account
      </h2>
      {googleUser ? (
        <>
          <p className="mt-2 text-sm font-bold text-green-400">
            Signed in · {googleUser.email} · Cloud backup on
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
            Not signed in · Data lost if you change phones
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Sign in with Google to back up receipts before switching phones.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="mt-4 w-full min-h-16 rounded-xl border-2 border-yellow-500 bg-yellow-950 py-3 text-sm font-black uppercase tracking-wider text-yellow-400 transition-transform active:scale-95"
          >
            Continue with Google
          </button>
        </>
      )}
    </section>
  );
}
