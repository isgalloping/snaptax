"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { GoogleSignInButtonHost } from "@/components/auth/GoogleSignInButtonHost";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { GoogleAuthResponse } from "@/lib/client/authApi";
import { apiFetch } from "@/lib/client/ghostClient";
import {
  fetchFounderProgramClient,
  type FounderProgramClientState,
} from "@/lib/founder/fetchFounderProgramClient";
import { logFounderEvent } from "@/lib/founder/logFounderEvent";
import { resolveDisplayTier } from "@/lib/founder/resolveDisplayTier";
import { isFounderScarcityUrgent } from "@/lib/founder/types";
import { formatCurrency } from "@/lib/format";
import { useDialogEscape } from "@/lib/ui/useDialogEscape";
import {
  isPaddleCheckoutClosed,
  isPaddleCheckoutCompleted,
  runPaddleCheckoutCompletedFlow,
} from "@/lib/billing/paddleCheckoutFlow";

type CheckoutIntentBody = {
  intentId?: string;
  paddlePriceId?: string;
  error?: { code?: string };
};

export interface FounderProgramSheetProps {
  onClose: () => void;
  isSignedIn: boolean;
  onGoogleSignedIn: (result: GoogleAuthResponse) => void | Promise<void>;
  onPaid: () => void | Promise<void>;
  onProgramFull?: () => void;
  seasonLabel: string;
  userEmail?: string;
}

function formatProgramFull(template: string, seatsTotal: number): string {
  return template.replace("{total}", String(seatsTotal));
}

export function FounderProgramSheet({
  onClose,
  isSignedIn,
  onGoogleSignedIn,
  onPaid,
  onProgramFull,
  seasonLabel,
  userEmail,
}: FounderProgramSheetProps) {
  const copy = useUserCopy().home.founderSheet;
  const paywallCopy = useUserCopy().paywall;
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<FounderProgramClientState | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paddleRef = useRef<Paddle | null>(null);
  const onPaidRef = useRef(onPaid);
  const onCloseRef = useRef(onClose);
  const onProgramFullRef = useRef(onProgramFull);
  const checkoutCompletedRef = useRef(false);

  useDialogEscape(true, onClose);

  useEffect(() => {
    onPaidRef.current = onPaid;
    onCloseRef.current = onClose;
    onProgramFullRef.current = onProgramFull;
  });

  const refreshProgram = useCallback(async (): Promise<FounderProgramClientState | null> => {
    const data = await fetchFounderProgramClient();
    if (data) {
      setProgram(data);
    }
    return data;
  }, []);

  const notifyProgramFull = useCallback(
    (seatsTotal: number) => {
      setError(formatProgramFull(copy.programFull, seatsTotal));
      onProgramFullRef.current?.();
    },
    [copy.programFull],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchFounderProgramClient();
        if (cancelled) return;
        if (!data) {
          setError(copy.paymentUnavailable);
          return;
        }
        setProgram(data);
        logFounderEvent("founder_sheet_view", { claimedCount: data.claimedCount });
      } catch {
        if (!cancelled) setError(copy.paymentUnavailable);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [copy.paymentUnavailable]);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) return;

    void initializePaddle({
      environment: token.startsWith("test_") ? "sandbox" : "production",
      token,
      eventCallback: (event) => {
        if (isPaddleCheckoutClosed(event)) {
          setPaying(false);
          return;
        }

        if (!isPaddleCheckoutCompleted(event)) return;

        const handled = runPaddleCheckoutCompletedFlow({
          alreadyHandled: checkoutCompletedRef.current,
          closeCheckout: () => paddleRef.current?.Checkout.close(),
          returnToApp: () => onCloseRef.current(),
          onPaid: () => onPaidRef.current(),
          onPaidError: () => {
            checkoutCompletedRef.current = false;
            logFounderEvent("founder_purchase_fail");
          },
        });

        if (handled) {
          checkoutCompletedRef.current = true;
        }
      },
    }).then((instance) => {
      paddleRef.current = instance ?? null;
    });
  }, []);

  const handleGoogleSignedIn = useCallback(
    async (result: GoogleAuthResponse) => {
      await onGoogleSignedIn(result);
      await refreshProgram();
    },
    [onGoogleSignedIn, refreshProgram],
  );

  const handleBecomeFounder = async () => {
    setPaying(true);
    setError(null);
    logFounderEvent("founder_checkout_start");

    try {
      const paddle = paddleRef.current;
      if (!paddle) {
        logFounderEvent("founder_purchase_fail");
        setError(copy.paymentUnavailable);
        return;
      }

      const fresh = await refreshProgram();
      if (!fresh) {
        logFounderEvent("founder_purchase_fail");
        setError(copy.paymentUnavailable);
        return;
      }
      if (!fresh.programOpen) {
        logFounderEvent("founder_purchase_fail");
        notifyProgramFull(fresh.seatsTotal);
        return;
      }

      const intentRes = await apiFetch("/api/billing/checkout-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxSeason: seasonLabel, founderPurchase: true }),
      });

      const intentData = (await intentRes.json()) as CheckoutIntentBody;

      if (!intentRes.ok) {
        logFounderEvent("founder_purchase_fail");
        if (intentData.error?.code === "FOUNDER_PROGRAM_FULL") {
          const updated = await refreshProgram();
          notifyProgramFull(updated?.seatsTotal ?? fresh.seatsTotal);
          return;
        }
        setError(copy.paymentUnavailable);
        return;
      }

      if (!intentData.intentId || !intentData.paddlePriceId) {
        logFounderEvent("founder_purchase_fail");
        setError(copy.paymentUnavailable);
        return;
      }

      paddle.Checkout.open({
        items: [{ priceId: intentData.paddlePriceId, quantity: 1 }],
        customData: {
          intentId: intentData.intentId,
        },
        customer: userEmail ? { email: userEmail } : undefined,
      });
    } catch {
      logFounderEvent("founder_purchase_fail");
      setError(copy.paymentFailed);
    } finally {
      setPaying(false);
    }
  };

  const displayTier = program ? resolveDisplayTier(program) : null;
  const priceUsd =
    displayTier && program ? program.tiers[displayTier]?.priceUsd : null;
  const alreadyEntitled = program?.user?.currentSeasonEntitled === true;
  const seatsUrgent = program != null && isFounderScarcityUrgent(program.remaining);
  const programFull =
    program != null ? formatProgramFull(copy.programFull, program.seatsTotal) : null;
  const claimLabel =
    priceUsd != null
      ? copy.becomeFounder.replace("{price}", formatCurrency(priceUsd))
      : copy.becomeFounder.replace("{price}", "…");

  const offerBlock =
    program && !alreadyEntitled ? (
      <>
        <p
          className={`text-sm font-bold ${seatsUrgent ? "text-red-400" : "text-yellow-400"}`}
        >
          {copy.seatsRemaining
            .replace("{remaining}", String(program.remaining))
            .replace("{total}", String(program.seatsTotal))}
        </p>
        {priceUsd != null && (
          <p className="mt-4 text-lg font-black text-white">
            {copy.seasonPrice.replace("{price}", formatCurrency(priceUsd))}
          </p>
        )}
        <p className="mt-2 text-xs font-bold text-zinc-400">
          {copy.offerEnds.replace("{total}", String(program.seatsTotal))}
        </p>
      </>
    ) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/70"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="founder-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="founder-sheet-title"
            className="text-xl font-black uppercase tracking-wider text-white"
          >
            {copy.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 min-w-12 rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 text-sm font-black uppercase tracking-wider text-zinc-300 transition-transform active:scale-95"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm font-bold text-zinc-400" aria-live="polite">
            …
          </p>
        ) : alreadyEntitled ? (
          <p className="text-sm leading-relaxed text-zinc-300">{copy.alreadyEntitled}</p>
        ) : (
          <>
            {offerBlock}
            {!program?.programOpen && programFull && (
              <p className="mt-4 text-sm font-bold text-red-400">{programFull}</p>
            )}
            {program?.programOpen && !isSignedIn && (
              <GoogleSignInButtonHost
                active={!loading && !isSignedIn}
                onGate={() => logFounderEvent("founder_google_gate")}
                onSignedIn={handleGoogleSignedIn}
              />
            )}
            {program?.programOpen && isSignedIn && (
              <button
                type="button"
                disabled={paying}
                onClick={() => void handleBecomeFounder()}
                className="mt-6 w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-60"
              >
                {paying ? paywallCopy.openingPaddle : claimLabel}
              </button>
            )}
            <button
              type="button"
              disabled={paying}
              onClick={onClose}
              className="mt-3 w-full min-h-12 py-3 text-sm font-bold text-zinc-400 transition-transform active:scale-95 disabled:opacity-60"
            >
              {copy.notNow}
            </button>
          </>
        )}

        {error && (
          <p className="mt-3 text-center text-sm font-bold text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
