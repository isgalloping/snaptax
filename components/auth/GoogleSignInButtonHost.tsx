"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ContinueWithGoogleButton } from "@/components/auth/ContinueWithGoogleButton";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import {
  type GoogleAuthResponse,
  signInWithGoogleCredential,
} from "@/lib/client/authApi";
import { ensureGhostSession } from "@/lib/client/ghostClient";
import { mapGoogleAuthErrorMessage } from "@/lib/client/googleAuthErrors";
import {
  mountGoogleSignInButton,
  type GoogleSignInMount,
} from "@/lib/client/googleAuth";

interface GoogleSignInButtonHostProps {
  active: boolean;
  onSignedIn: (result: GoogleAuthResponse) => void | Promise<void>;
  onGate?: () => void;
  className?: string;
}

/**
 * English branded button with invisible GIS overlay (credential flow stays in-sheet).
 */
export function GoogleSignInButtonHost({
  active,
  onSignedIn,
  onGate,
  className = "mt-6",
}: GoogleSignInButtonHostProps) {
  const authCopy = useUserCopy().auth.googleSignIn;
  const [preparing, setPreparing] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<GoogleSignInMount | null>(null);
  const signingInRef = useRef(false);
  const onSignedInRef = useRef(onSignedIn);
  const onGateRef = useRef(onGate);

  const errorMessages = useMemo(
    () => ({
      signInFailed: authCopy.signInFailed,
      signInUnauthorized: authCopy.signInUnauthorized,
      signInGhostBound: authCopy.signInGhostBound,
      signInServerError: authCopy.signInServerError,
      signInConfig: authCopy.signInConfig,
      ghostRegisterFailed: authCopy.ghostRegisterFailed,
    }),
    [
      authCopy.signInFailed,
      authCopy.signInUnauthorized,
      authCopy.signInGhostBound,
      authCopy.signInServerError,
      authCopy.signInConfig,
      authCopy.ghostRegisterFailed,
    ],
  );

  useEffect(() => {
    onSignedInRef.current = onSignedIn;
    onGateRef.current = onGate;
  });

  useEffect(() => {
    if (!active) {
      mountRef.current?.cleanup();
      mountRef.current = null;
      setPreparing(false);
      setSigningIn(false);
      signingInRef.current = false;
      return;
    }

    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;

    const handleAuthError = (error: unknown) => {
      const message = mapGoogleAuthErrorMessage(error, errorMessages);
      if (message) setInlineError(message);
    };

    const handleCredential = (credential: string) => {
      if (signingInRef.current) return;
      signingInRef.current = true;
      onGateRef.current?.();
      setSigningIn(true);
      setInlineError(null);

      void (async () => {
        try {
          const result = await signInWithGoogleCredential(credential);
          if (cancelled) return;
          await onSignedInRef.current(result);
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
        if (!cancelled) handleAuthError(error);
      } finally {
        if (!cancelled) setPreparing(false);
      }
    })();

    return () => {
      cancelled = true;
      mountRef.current?.cleanup();
      mountRef.current = null;
    };
  }, [active, errorMessages]);

  const busy = preparing || signingIn;

  return (
    <div className={className}>
      <div className="relative min-h-16 w-full">
        <ContinueWithGoogleButton
          onClick={() => {}}
          disabled={busy}
          className="pointer-events-none"
        />
        <div
          ref={hostRef}
          className={`absolute inset-0 flex items-center justify-center overflow-hidden ${
            busy ? "pointer-events-none opacity-60" : "cursor-pointer opacity-0"
          }`}
          aria-busy={busy}
          aria-label="Continue with Google"
        />
      </div>
      {preparing && !signingIn && (
        <p className="mt-2 text-center text-sm font-bold text-zinc-400">
          {authCopy.preparingGoogle}
        </p>
      )}
      {signingIn && (
        <p className="mt-2 text-center text-sm font-bold text-zinc-400">
          {authCopy.signingIn}
        </p>
      )}
      {inlineError && (
        <p className="mt-3 text-center text-sm font-bold text-red-500" role="alert">
          {inlineError}
        </p>
      )}
    </div>
  );
}
