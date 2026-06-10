"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { warmReceiptDb } from "@/lib/storage/receiptDb";
import {
  LANDING_FADE_MS,
  landingDismissMs,
  type LandingVariant,
} from "@/lib/landing/landingVariant";
import { DATA_STREAM_CHECKLIST_TITLE } from "./dataStreamCopy";
import { SIMPLE_USING_STATUS_LINES } from "./simpleUsingCopy";
import { DataStreamLanding } from "./DataStreamLanding";
import { SimpleUsingLanding } from "./SimpleUsingLanding";

type Phase = "visible" | "exiting" | "done";

interface LandingGateProps {
  variant: LandingVariant;
  onDismiss: () => void;
}

function landingAriaLabel(variant: LandingVariant): string {
  if (variant === "data_stream") {
    return DATA_STREAM_CHECKLIST_TITLE;
  }
  return SIMPLE_USING_STATUS_LINES[0] ?? "Loading Snap1099";
}

export function LandingGate({ variant, onDismiss }: LandingGateProps) {
  const [phase, setPhase] = useState<Phase>("visible");
  const exitTimerRef = useRef<number | null>(null);
  const doneTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (doneTimerRef.current != null) {
      window.clearTimeout(doneTimerRef.current);
      doneTimerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimers();
    setPhase("done");
    onDismiss();
  }, [clearTimers, onDismiss]);

  const beginExit = useCallback(() => {
    clearTimers();
    setPhase("exiting");
    doneTimerRef.current = window.setTimeout(dismiss, LANDING_FADE_MS);
  }, [clearTimers, dismiss]);

  useEffect(() => {
    void warmReceiptDb();

    const holdMs = landingDismissMs(variant);
    exitTimerRef.current = window.setTimeout(beginExit, holdMs);

    return clearTimers;
  }, [variant, beginExit, clearTimers]);

  if (phase === "done") return null;

  return (
    <div
      className={`landing-overlay fixed inset-0 z-50 flex flex-col bg-zinc-950 ${
        phase === "exiting" ? "landing-overlay-exit" : ""
      }`}
      role="status"
      aria-live="polite"
      aria-label={landingAriaLabel(variant)}
    >
      {variant === "data_stream" ? (
        <DataStreamLanding />
      ) : (
        <SimpleUsingLanding onStart={beginExit} />
      )}
    </div>
  );
}
