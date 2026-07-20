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
import { waitForGisButtonInHost } from "@/lib/client/waitForGisButton";

interface GoogleSignInButtonHostProps {
  active: boolean;
  onSignedIn: (result: GoogleAuthResponse) => void | Promise<void>;
  onGate?: () => void;
  className?: string;
}

/**
 * English branded shell with a near-transparent GIS overlay on top.
 * Mobile WebViews ignore programmatic .click() on hidden GIS iframes and often
 * block opacity-0 touch targets — use opacity ~0.02 so real taps reach GIS.
 */
export function GoogleSignInButtonHost({
  active,
  onSignedIn,
  onGate,
  className = "mt-6",
}: GoogleSignInButtonHostProps) {
  const authCopy = useUserCopy().auth.googleSignIn;
  const googleCtaLabel = useUserCopy().settings.account.googleCta;
  const [preparing, setPreparing] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [gisReady, setGisReady] = useState(false);
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
      setGisReady(false);
      signingInRef.current = false;
      return;
    }

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

    const mountGis = async (): Promise<boolean> => {
      const host = hostRef.current;
      if (!host) return false;

      setPreparing(true);
      setInlineError(null);
      setGisReady(false);

      try {
        await ensureGhostSession();
        if (cancelled) return false;
        mountRef.current?.cleanup();
        mountRef.current = await mountGoogleSignInButton(host, {
          onCredential: handleCredential,
          onError: (error) => {
            if (!cancelled) handleAuthError(error);
          },
        });
        const gisButton = await waitForGisButtonInHost(host);
        if (cancelled) return false;
        if (!gisButton) {
          handleAuthError(new Error("GIS_BUTTON_FAILED"));
          return false;
        }
        setGisReady(true);
        return true;
      } catch (error) {
        if (!cancelled) handleAuthError(error);
        return false;
      } finally {
        if (!cancelled) setPreparing(false);
      }
    };

    void (async () => {
      const mounted = await mountGis();
      if (!mounted && !cancelled) {
        requestAnimationFrame(() => {
          if (!cancelled) void mountGis();
        });
      }
    })();

    return () => {
      cancelled = true;
      mountRef.current?.cleanup();
      mountRef.current = null;
      setGisReady(false);
    };
  }, [active, errorMessages]);

  const busy = preparing || signingIn;
  const touchEnabled = gisReady && !busy;

  return (
    <div className={className}>
      <div className="relative min-h-16 w-full">
        <div className="relative z-[1]" aria-hidden="true">
          <ContinueWithGoogleButton
            onClick={() => {}}
            disabled={busy}
            className="pointer-events-none"
          />
        </div>
        <div
          ref={hostRef}
          className={`absolute inset-0 z-[2] flex items-center justify-center overflow-hidden ${
            touchEnabled
              ? "cursor-pointer opacity-[0.02]"
              : "pointer-events-none opacity-60"
          }`}
          role="button"
          tabIndex={touchEnabled ? 0 : -1}
          aria-busy={busy}
          aria-label={googleCtaLabel}
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
