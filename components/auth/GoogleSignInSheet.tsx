"use client";

import { useState } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { signInWithGoogleApi } from "@/lib/client/authApi";
import { ensureGhostSession } from "@/lib/client/ghostClient";

export type GoogleSignInMode =
  | "soft"
  | "hard-export"
  | "hard-sync"
  | "onboarding-signup";

export type GoogleSignInResult = {
  taxRecalcQueued: number;
};

interface GoogleSignInSheetProps {
  mode: GoogleSignInMode;
  onClose: () => void;
  onSuccess: (result: GoogleSignInResult) => void | Promise<void>;
  onFailure?: (message: string) => void;
  onSoftDismiss?: () => void;
  onSignIn?: () => Promise<GoogleSignInResult>;
}

export function GoogleSignInSheet({
  mode,
  onClose,
  onSuccess,
  onFailure,
  onSoftDismiss,
  onSignIn,
}: GoogleSignInSheetProps) {
  const authCopy = useUserCopy().auth.googleSignIn;
  const [loading, setLoading] = useState(false);

  const modeCopy =
    mode === "soft"
      ? authCopy.soft
      : mode === "hard-export"
        ? authCopy.hardExport
        : mode === "onboarding-signup"
          ? authCopy.onboardingSignup
          : authCopy.hardSync;
  const showNotNow = mode === "soft" || mode === "onboarding-signup";
  const dismissLabel =
    mode === "onboarding-signup" ? authCopy.onboardingSignup.later : authCopy.notNow;

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await ensureGhostSession();
      const result = onSignIn
        ? await onSignIn()
        : {
            taxRecalcQueued: (await signInWithGoogleApi()).taxRecalcQueued,
          };
      await onSuccess(result);
    } catch {
      onFailure?.(authCopy.signInFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10">
        <p className="text-lg font-black uppercase tracking-wider text-white">
          {modeCopy.title}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">{modeCopy.body}</p>

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleGoogle()}
          className="mt-6 w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-60"
        >
          {loading ? authCopy.signingIn : authCopy.continueWithGoogle}
        </button>

        {showNotNow ? (
          <button
            type="button"
            onClick={() => {
              onSoftDismiss?.();
              onClose();
            }}
            className="mt-3 w-full min-h-16 py-3 text-sm font-bold text-zinc-400 transition-transform active:scale-95"
          >
            {dismissLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full min-h-16 py-3 text-sm font-black uppercase tracking-wider text-zinc-400 transition-transform active:scale-95"
          >
            {authCopy.back}
          </button>
        )}
      </div>
    </div>
  );
}
