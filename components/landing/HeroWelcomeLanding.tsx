"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { commitHeroLandingStart } from "@/lib/onboarding/onboardingState";
import {
  beginHeroLandingSession,
  endHeroLandingSession,
  heroCountdownSeconds,
} from "@/lib/landing/heroLandingSession";
import {
  HERO_AUTO_ADVANCE_MS,
  HERO_CTA_READY_MS,
} from "@/lib/landing/heroLandingTiming";
import { LANDING_CTA_EVENT } from "./landingEvents";

const HERO_IMAGE = "/onboarding/onboarding-hero.png";
const COUNTDOWN_TICK_MS = 100;
const HERO_COUNTDOWN_START = Math.ceil(HERO_AUTO_ADVANCE_MS / 1000);

function formatCtaCountdown(template: string, seconds: number): string {
  return template.replace("{seconds}", String(seconds));
}

export function HeroWelcomeLanding() {
  const copy = useUserCopy().onboarding.landing;
  const [ctaReady, setCtaReady] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(HERO_COUNTDOWN_START);
  const startedRef = useRef(false);

  const startOnboarding = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    await commitHeroLandingStart();
    endHeroLandingSession();
    window.dispatchEvent(new Event(LANDING_CTA_EVENT));
  }, []);

  useEffect(() => {
    beginHeroLandingSession();
    setCountdownSeconds(heroCountdownSeconds(HERO_AUTO_ADVANCE_MS, 0));

    const ctaTimer = window.setTimeout(() => setCtaReady(true), HERO_CTA_READY_MS);
    const autoTimer = window.setTimeout(() => {
      void startOnboarding();
    }, HERO_AUTO_ADVANCE_MS);
    const countdownTimer = window.setInterval(() => {
      setCountdownSeconds(heroCountdownSeconds(HERO_AUTO_ADVANCE_MS));
    }, COUNTDOWN_TICK_MS);

    return () => {
      window.clearTimeout(ctaTimer);
      window.clearTimeout(autoTimer);
      window.clearInterval(countdownTimer);
      endHeroLandingSession();
    };
  }, [startOnboarding]);

  const handleStart = () => {
    if (!ctaReady) return;
    void startOnboarding();
  };

  const buttonLabel = ctaReady
    ? copy.cta
    : formatCtaCountdown(copy.ctaCountdown, countdownSeconds);

  const checks = [copy.check1, copy.check2, copy.check3];

  return (
    <div className="hero-welcome-landing relative flex h-full min-h-0 flex-col overflow-hidden bg-black">
      <div className="absolute inset-0" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt=""
          className={`h-full w-full object-cover object-top transition-opacity duration-500 ${
            heroLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setHeroLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col justify-end px-5 pb-4 pt-16">
        <h1 className="text-center text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
          {copy.headlineLead}{" "}
          <span className="text-yellow-500">{copy.headlineAccent}</span>
        </h1>
        <p className="mt-3 text-center text-sm font-bold leading-snug text-zinc-300">
          {copy.tagline}
        </p>

        <ul className="mt-6 space-y-3">
          {checks.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 text-sm font-bold text-zinc-100"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
                aria-hidden
              >
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex justify-center gap-2" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          <span className="h-2 w-2 rounded-full bg-zinc-600" />
          <span className="h-2 w-2 rounded-full bg-zinc-600" />
        </div>
      </div>

      <button
        type="button"
        disabled={!ctaReady}
        onClick={handleStart}
        aria-label={copy.ctaAria}
        className="relative z-10 mx-5 mb-6 min-h-16 rounded-xl bg-yellow-500 text-base font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-50"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
