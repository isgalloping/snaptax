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
  onDismissWithoutPay?: () => void;
  onPaid: () => void | Promise<void>;
}

function BalanceScaleIllustration() {
  return (
    <div
      className="mx-auto my-6 flex max-w-xs items-end justify-center gap-4"
      aria-hidden
    >
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-zinc-600 bg-zinc-800 text-2xl">
          📄
        </div>
        <span className="h-1 w-16 rounded bg-zinc-600" />
      </div>
      <div className="flex flex-col items-center">
        <div className="h-16 w-1 rounded bg-yellow-500" />
        <div className="h-3 w-3 rotate-45 border-2 border-yellow-500 bg-zinc-900" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-green-600 bg-green-950/50 text-2xl">
          🛡️
        </div>
        <span className="h-1 w-16 rounded bg-zinc-600" />
      </div>
    </div>
  );
}

export function PaywallSheet({
  seasonLabel,
  userId,
  onClose,
  onDismissWithoutPay,
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
  }, [copy.paymentFailed]);

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

  const handleDismiss = () => {
    onDismissWithoutPay?.();
    onClose();
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
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10">
        <BalanceScaleIllustration />
        <p className="text-center text-xl font-black uppercase tracking-wider text-white">
          {copy.unlockTitle}
        </p>
        <p className="mt-2 text-center text-sm text-zinc-400">
          {copy.oneTimeSeason.replace("{season}", seasonLabel)}
        </p>

        <ul className="mt-6 space-y-3">
          {copy.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
              <span className="mt-0.5 font-black text-green-400" aria-hidden>
                ✓
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm font-bold text-yellow-400">{copy.backupWarning}</p>

        <button
          type="button"
          disabled={paying}
          onClick={() => void handlePay()}
          className="mt-6 w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-60"
        >
          {paying ? copy.openingPaddle : copy.unlockNow}
        </button>
        {error && (
          <p className="mt-3 text-center text-sm font-bold text-red-500" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-3 w-full min-h-16 py-3 text-sm font-bold text-zinc-400 transition-transform active:scale-95"
        >
          {copy.maybeLater}
        </button>
      </div>
    </div>
  );
}
