"use client";

import { useEffect, useRef, useState } from "react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { apiFetch } from "@/lib/client/ghostClient";

type PaywallPhase = "offer" | "confirming";

interface PaywallSheetProps {
  seasonLabel: string;
  userId: string;
  onClose: () => void;
  onPaid: () => void | Promise<void>;
}

export function PaywallSheet({
  seasonLabel,
  userId,
  onClose,
  onPaid,
}: PaywallSheetProps) {
  const copy = useUserCopy().paywall;
  const [phase, setPhase] = useState<PaywallPhase>("offer");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paddleRef = useRef<Paddle | null>(null);
  const onPaidRef = useRef(onPaid);
  const checkoutCompletedRef = useRef(false);

  useEffect(() => {
    onPaidRef.current = onPaid;
  });

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
            setError(copy.paymentFailed);
          }
        })();
      },
    }).then((instance) => {
      paddleRef.current = instance ?? null;
    });
  }, []);

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;
      const paddle = paddleRef.current;

      if (!paddle || !priceId) {
        setError(copy.paymentUnavailable);
        return;
      }

      const intentRes = await apiFetch("/api/billing/checkout-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxSeason: seasonLabel }),
      });

      if (!intentRes.ok) {
        setError(copy.paymentUnavailable);
        return;
      }

      const intentData = (await intentRes.json()) as { intentId?: string };
      if (!intentData.intentId) {
        setError(copy.paymentUnavailable);
        return;
      }

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: {
          intentId: intentData.intentId,
        },
        customer: { email: userId },
      });
    } catch {
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
            {copy.confirmingPaymentHint}
          </p>
          <p className="mt-6 text-center text-sm font-bold text-zinc-400" aria-live="polite">
            {copy.openingExport}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10">
        <p className="text-4xl font-black text-white">$49.00</p>
        <p className="mt-1 text-sm text-zinc-400">
          {copy.oneTimeSeason.replace("{season}", seasonLabel)}
        </p>
        <p className="mt-4 text-base leading-relaxed text-zinc-300">
          {copy.description}
        </p>
        <p className="mt-4 text-sm font-bold text-yellow-400">
          {copy.backupWarning}
        </p>
        <button
          type="button"
          disabled={paying}
          onClick={() => void handlePay()}
          className="mt-6 w-full min-h-16 rounded-xl bg-white py-4 text-lg font-black text-black transition-transform active:scale-95 disabled:opacity-60"
        >
          {paying ? copy.openingPaddle : copy.payButton}
        </button>
        {error && (
          <p className="mt-3 text-center text-sm font-bold text-red-500" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full min-h-16 py-3 text-sm font-bold text-zinc-400 transition-transform active:scale-95"
        >
          {copy.back}
        </button>
      </div>
    </div>
  );
}
