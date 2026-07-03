"use client";

import { useEffect, useRef, useState } from "react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { ContinueWithGoogleButton } from "@/components/auth/ContinueWithGoogleButton";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { logFounderEvent } from "@/lib/founder/logFounderEvent";
import { resolveDisplayTier } from "@/lib/founder/resolveDisplayTier";
import type { FounderStatus, FounderTier } from "@/lib/founder/types";
import { formatCurrency } from "@/lib/format";
import { apiFetch } from "@/lib/client/ghostClient";
import { useDialogEscape } from "@/lib/ui/useDialogEscape";

type FounderSheetPhase = "offer" | "confirming";

type FounderTierConfig = {
  priceUsd: number;
  priceCents: number;
  paddlePriceId: string;
  seatRange: [number, number] | null;
};

type FounderProgramState = {
  seatsTotal: number;
  claimedCount: number;
  remaining: number;
  programOpen: boolean;
  tiers: Record<FounderTier, FounderTierConfig>;
  user: {
    founderStatus: FounderStatus;
    founderTier: FounderTier | null;
    founderNumber: number | null;
    currentSeasonEntitled: boolean;
  } | null;
};

export interface FounderProgramSheetProps {
  onClose: () => void;
  isSignedIn: boolean;
  onRequestGoogleSignIn: () => void;
  onPaid: () => void | Promise<void>;
  seasonLabel: string;
  userEmail?: string;
}

export function FounderProgramSheet({
  onClose,
  isSignedIn,
  onRequestGoogleSignIn,
  onPaid,
  seasonLabel,
  userEmail,
}: FounderProgramSheetProps) {
  const copy = useUserCopy().home.founderSheet;
  const paywallCopy = useUserCopy().paywall;
  const [phase, setPhase] = useState<FounderSheetPhase>("offer");
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<FounderProgramState | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paddleRef = useRef<Paddle | null>(null);
  const onPaidRef = useRef(onPaid);
  const checkoutCompletedRef = useRef(false);

  useDialogEscape(true, onClose);

  useEffect(() => {
    onPaidRef.current = onPaid;
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await apiFetch("/api/founder/program");
        if (!res.ok) {
          if (!cancelled) setError(copy.paymentUnavailable);
          return;
        }
        const data = (await res.json()) as FounderProgramState;
        if (!cancelled) {
          setProgram(data);
          logFounderEvent("founder_sheet_view", { claimedCount: data.claimedCount });
        }
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
        if (event.name !== "checkout.completed" || checkoutCompletedRef.current) {
          return;
        }
        checkoutCompletedRef.current = true;
        setPhase("confirming");
        setError(null);
        void (async () => {
          try {
            await onPaidRef.current();
          } catch {
            checkoutCompletedRef.current = false;
            setPhase("offer");
            logFounderEvent("founder_purchase_fail");
            setError(copy.paymentFailed);
          }
        })();
      },
    }).then((instance) => {
      paddleRef.current = instance ?? null;
    });
  }, [copy.paymentFailed]);

  const handleGoogleSignIn = () => {
    logFounderEvent("founder_google_gate");
    onRequestGoogleSignIn();
  };

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

      const intentRes = await apiFetch("/api/billing/checkout-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxSeason: seasonLabel, founderPurchase: true }),
      });

      if (!intentRes.ok) {
        logFounderEvent("founder_purchase_fail");
        setError(copy.paymentUnavailable);
        return;
      }

      const intentData = (await intentRes.json()) as {
        intentId?: string;
        paddlePriceId?: string;
      };

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

  if (phase === "confirming") {
    return (
      <div className="fixed inset-0 z-50 flex items-end bg-black/70">
        <div className="w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10">
          <p className="text-lg font-black uppercase tracking-wider text-white">
            {copy.confirmingPayment}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">
            {paywallCopy.confirmingPaymentHint}
          </p>
        </div>
      </div>
    );
  }

  const displayTier = program ? resolveDisplayTier(program) : null;
  const priceUsd =
    displayTier && program ? program.tiers[displayTier]?.priceUsd : null;
  const alreadyEntitled = program?.user?.currentSeasonEntitled === true;

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
        ) : !isSignedIn ? (
          <>
            <p className="text-sm leading-relaxed text-zinc-300">{copy.signInFirst}</p>
            <ContinueWithGoogleButton onClick={handleGoogleSignIn} className="mt-6" />
          </>
        ) : alreadyEntitled ? (
          <p className="text-sm leading-relaxed text-zinc-300">{copy.alreadyEntitled}</p>
        ) : (
          <>
            {program && (
              <p className="text-sm font-bold text-yellow-400">
                {copy.seatsRemaining
                  .replace("{remaining}", String(program.remaining))
                  .replace("{total}", String(program.seatsTotal))}
              </p>
            )}
            {priceUsd != null && (
              <p className="mt-4 text-lg font-black text-white">
                {copy.seasonPrice.replace("{price}", formatCurrency(priceUsd))}
              </p>
            )}
            <button
              type="button"
              disabled={paying || !program?.programOpen}
              onClick={() => void handleBecomeFounder()}
              className="mt-6 w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-60"
            >
              {paying ? paywallCopy.openingPaddle : copy.becomeFounder}
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
