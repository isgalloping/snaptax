"use client";

import { useEffect, useState } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { LandingCameraHero } from "./LandingCameraHero";

export const LANDING_CTA_EVENT = "snap1099:landing-cta";

export function WorkerWelcomeLanding() {
  const copy = useUserCopy().onboarding.landing;
  const [ctaReady, setCtaReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setCtaReady(true), 600);
    return () => window.clearTimeout(timer);
  }, []);

  const handleStart = () => {
    if (!ctaReady) return;
    window.dispatchEvent(new Event(LANDING_CTA_EVENT));
  };

  const steps = [copy.step1, copy.step2, copy.step3];

  return (
    <div className="worker-welcome-landing relative flex h-full min-h-0 flex-col overflow-hidden bg-zinc-950 px-4 pb-4">
      <div
        className="data-stream-grid-bg pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      />
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center">
        <LandingCameraHero />
        <h1 className="mt-4 text-center text-2xl font-black tracking-tight text-white sm:text-3xl">
          {copy.headline}
        </h1>
        <p className="mt-2 max-w-sm text-center text-sm font-bold leading-snug text-zinc-300">
          {copy.tagline}
        </p>
        <ol className="mt-6 w-full max-w-sm space-y-3">
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex gap-3 text-sm font-bold leading-snug text-zinc-200"
            >
              <span className="shrink-0 text-yellow-500" aria-hidden>
                {index + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <button
        type="button"
        disabled={!ctaReady}
        onClick={handleStart}
        aria-label={copy.ctaAria}
        className="relative z-10 mt-4 min-h-16 w-full rounded-xl bg-yellow-500 text-sm font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-50"
      >
        {copy.cta}
      </button>
    </div>
  );
}
