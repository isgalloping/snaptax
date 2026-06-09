"use client";

import { useEffect, useState } from "react";

const SHUTTER_COOLDOWN_MS = 1000;
const RING_SIZE = 72;
const STROKE = 4;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CameraShutterControlProps {
  ready: boolean;
  capturing: boolean;
  onClick: () => void;
  showLabel?: boolean;
}

export function CameraShutterControl({
  ready,
  capturing,
  onClick,
  showLabel = true,
}: CameraShutterControlProps) {
  const [arcProgress, setArcProgress] = useState(1);

  useEffect(() => {
    if (!capturing) {
      setArcProgress(1);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const next = Math.max(0, 1 - elapsed / SHUTTER_COOLDOWN_MS);
      setArcProgress(next);
      if (next > 0) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [capturing]);

  const showArc = capturing && arcProgress > 0;
  const dashOffset = CIRCUMFERENCE * (1 - arcProgress);

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={!ready || capturing}
        aria-label="Take photo"
        aria-busy={capturing}
        className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
      >
        <svg
          className="absolute inset-0 h-full w-full -rotate-90"
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          aria-hidden
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgb(24 24 27)"
            strokeWidth={STROKE}
          />
          {showArc && (
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgb(34 197 94)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
            />
          )}
          {!showArc && ready && (
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgb(34 197 94 / 0.85)"
              strokeWidth={STROKE}
            />
          )}
        </svg>
        <span className="relative z-[1] h-14 w-14 rounded-full bg-white shadow-inner" />
      </button>
      {showLabel && (
        <span className="text-[9px] font-bold uppercase tracking-wide text-white">
          Take Photo
        </span>
      )}
    </div>
  );
}
