"use client";

import { useEffect, useRef, useState } from "react";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { apiFetch } from "@/lib/client/ghostClient";

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
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paddleRef = useRef<Paddle | null>(null);
  const onPaidRef = useRef(onPaid);
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
        if (event.name === "checkout.completed") {
          void onPaidRef.current();
        }
      },
    }).then((instance) => {
      paddleRef.current = instance ?? null;
    });
  }, []);

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const me = await apiFetch("/api/auth/me");
      const meData = (await me.json()) as { user?: { id: string } | null };
      const dbUserId = meData.user?.id;
      const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;
      const paddle = paddleRef.current;

      if (paddle && priceId && dbUserId) {
        paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customData: {
            userId: dbUserId,
            taxSeason: seasonLabel,
          },
          customer: { email: userId },
        });
        return;
      }

      setError(copy.paymentUnavailable);
    } catch {
      setError(copy.paymentFailed);
    } finally {
      setPaying(false);
    }
  };

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
