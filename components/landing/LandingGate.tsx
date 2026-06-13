"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { warmReceiptDb } from "@/lib/storage/receiptDb";
import {
  LANDING_FADE_MS,
  LANDING_POLL_MS,
  landingElapsedMs,
  resolveExit,
  type LandingExitMode,
} from "@/lib/landing/landingTiming";
import { DEFAULT_LOCALE, getUserCopy } from "@/lib/i18n";
import { LANDING_CTA_EVENT } from "./WorkerWelcomeLanding";

type Phase = "visible" | "exiting" | "done";

interface LandingGateProps {
  homeChunkReady: boolean;
  onExit: (mode: LandingExitMode) => void;
}

export function LandingGate({ homeChunkReady, onExit }: LandingGateProps) {
  const [phase, setPhase] = useState<Phase>("visible");
  const pollTimerRef = useRef<number | null>(null);
  const doneTimerRef = useRef<number | null>(null);
  const exitModeRef = useRef<LandingExitMode>("full-home");
  const exitedRef = useRef(false);
  const homeChunkReadyRef = useRef(homeChunkReady);
  homeChunkReadyRef.current = homeChunkReady;

  const clearTimers = useCallback(() => {
    if (pollTimerRef.current != null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (doneTimerRef.current != null) {
      window.clearTimeout(doneTimerRef.current);
      doneTimerRef.current = null;
    }
  }, []);

  const finishExit = useCallback(() => {
    clearTimers();
    document.documentElement.classList.remove("landing-exiting");
    document.documentElement.classList.add("landing-done");
    window.dispatchEvent(new Event("snap1099:landing-done"));
    setPhase("done");
    onExit(exitModeRef.current);
  }, [clearTimers, onExit]);

  const beginExit = useCallback(
    (mode: LandingExitMode) => {
      if (exitedRef.current) return;
      exitedRef.current = true;
      clearTimers();
      exitModeRef.current = mode;
      setPhase("exiting");
      document.documentElement.classList.add("landing-exiting");
      doneTimerRef.current = window.setTimeout(finishExit, LANDING_FADE_MS);
    },
    [clearTimers, finishExit],
  );

  const tick = useCallback(() => {
    if (exitedRef.current) return;
    const mode = resolveExit(
      landingElapsedMs(),
      homeChunkReadyRef.current,
    );
    if (mode) beginExit(mode);
  }, [beginExit]);

  useEffect(() => {
    void warmReceiptDb();
    performance.mark("startup:landing-paint");
  }, []);

  useEffect(() => {
    pollTimerRef.current = window.setInterval(tick, LANDING_POLL_MS);
    tick();

    return clearTimers;
  }, [tick, clearTimers]);

  useEffect(() => {
    tick();
  }, [homeChunkReady, tick]);

  useEffect(() => {
    const onCta = () => {
      if (homeChunkReadyRef.current) {
        beginExit("full-home");
        return;
      }
      const tryExit = () => {
        if (homeChunkReadyRef.current) beginExit("full-home");
      };
      window.setTimeout(tryExit, 100);
      window.setTimeout(tryExit, 500);
    };
    window.addEventListener(LANDING_CTA_EVENT, onCta);
    return () => window.removeEventListener(LANDING_CTA_EVENT, onCta);
  }, [beginExit]);

  if (phase === "done") return null;

  const landingAria = getUserCopy(DEFAULT_LOCALE).onboarding.landing.ariaStatus;

  return (
    <div
      className="sr-only"
      role="status"
      aria-live="polite"
      aria-label={landingAria}
    />
  );
}
