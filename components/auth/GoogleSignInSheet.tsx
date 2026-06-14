"use client";

import { useEffect, useRef, useState } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import {
  type GoogleAuthResponse,
  signInWithGoogleCredential,
} from "@/lib/client/authApi";
import { ensureGhostSession } from "@/lib/client/ghostClient";
import {
  mapGoogleAuthError,
  mountGoogleSignInButton,
  type GoogleSignInMount,
} from "@/lib/client/googleAuth";

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
  onUserSignedIn?: (result: GoogleAuthResponse) => void;
}

export function GoogleSignInSheet({
  mode,
  onClose,
  onSuccess,
  onFailure,
  onSoftDismiss,
  onUserSignedIn,
}: GoogleSignInSheetProps) {
  const userCopy = useUserCopy();
  const authCopy = userCopy.auth.googleSignIn;
  const [signingIn, setSigningIn] = useState(false);
  const [preparing, setPreparing] = useState(true);
  const [mountFailed, setMountFailed] = useState(false);
  const [mountAttempt, setMountAttempt] = useState(0);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const buttonHostRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<GoogleSignInMount | null>(null);
  const signingInRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onFailureRef = useRef(onFailure);
  const onUserSignedInRef = useRef(onUserSignedIn);
  onSuccessRef.current = onSuccess;
  onFailureRef.current = onFailure;
  onUserSignedInRef.current = onUserSignedIn;

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

  useEffect(() => {
    const host = buttonHostRef.current;
    if (!host) return;

    let cancelled = false;

    const handleAuthError = (error: unknown) => {
      const message = mapGoogleAuthError(error, authCopy.signInFailed);
      if (message) {
        setInlineError(message);
        onFailureRef.current?.(message);
      }
    };

    const handleCredential = (credential: string) => {
      if (signingInRef.current) return;
      signingInRef.current = true;
      setSigningIn(true);
      setInlineError(null);

      void (async () => {
        try {
          const result = await signInWithGoogleCredential(credential);
          if (cancelled) return;
          onUserSignedInRef.current?.(result);
          try {
            await onSuccessRef.current({ taxRecalcQueued: result.taxRecalcQueued });
          } catch (syncError) {
            console.error("[auth] post-login sync failed", syncError);
          }
        } catch (error) {
          if (!cancelled) handleAuthError(error);
        } finally {
          signingInRef.current = false;
          if (!cancelled) setSigningIn(false);
        }
      })();
    };

    void (async () => {
      setPreparing(true);
      setMountFailed(false);
      setInlineError(null);
      try {
        await ensureGhostSession();
        if (cancelled) return;
        mountRef.current?.cleanup();
        mountRef.current = await mountGoogleSignInButton(host, {
          onCredential: handleCredential,
          onError: (error) => {
            if (!cancelled) handleAuthError(error);
          },
        });
      } catch (error) {
        if (!cancelled) {
          setMountFailed(true);
          handleAuthError(error);
        }
      } finally {
        if (!cancelled) setPreparing(false);
      }
    })();

    return () => {
      cancelled = true;
      mountRef.current?.cleanup();
      mountRef.current = null;
    };
  }, [authCopy.signInFailed, mountAttempt]);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10">
        <p className="text-lg font-black uppercase tracking-wider text-white">
          {modeCopy.title}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">{modeCopy.body}</p>

        <div className="relative mt-6 min-h-16 w-full">
          <div
            ref={buttonHostRef}
            className={`flex w-full justify-center ${signingIn ? "pointer-events-none opacity-60" : ""}`}
            aria-busy={preparing || signingIn}
          />
          {preparing && (
            <p className="mt-2 text-center text-sm font-bold text-zinc-400">
              {authCopy.signingIn}
            </p>
          )}
          {signingIn && !preparing && (
            <p className="mt-2 text-center text-sm font-bold text-zinc-400">
              {authCopy.signingIn}
            </p>
          )}
        </div>

        {mountFailed && !preparing && (
          <button
            type="button"
            disabled={signingIn}
            onClick={() => setMountAttempt((attempt) => attempt + 1)}
            className="mt-3 w-full min-h-12 rounded-xl border-2 border-yellow-500 py-3 text-sm font-black uppercase tracking-wider text-yellow-500 transition-transform active:scale-95 disabled:opacity-60"
          >
            {userCopy.camera.retry}
          </button>
        )}

        {inlineError && (
          <p className="mt-3 text-center text-sm font-bold text-red-500" role="alert">
            {inlineError}
          </p>
        )}

        {showNotNow ? (
          <button
            type="button"
            disabled={signingIn}
            onClick={() => {
              onSoftDismiss?.();
              onClose();
            }}
            className="mt-3 w-full min-h-16 py-3 text-sm font-bold text-zinc-400 transition-transform active:scale-95 disabled:opacity-60"
          >
            {dismissLabel}
          </button>
        ) : (
          <button
            type="button"
            disabled={signingIn}
            onClick={onClose}
            className="mt-3 w-full min-h-16 py-3 text-sm font-black uppercase tracking-wider text-zinc-400 transition-transform active:scale-95 disabled:opacity-60"
          >
            {authCopy.back}
          </button>
        )}
      </div>
    </div>
  );
}
