"use client";

import { useEffect, useState } from "react";

const SHUTTER_COOLDOWN_MS = 1000;

const COMPACT_RING = 52;
const FULL_RING = 72;

interface CameraShutterControlProps {
  ready: boolean;
  capturing: boolean;
  onClick: () => void;
  showLabel?: boolean;
  compact?: boolean;
}

export function CameraShutterControl({
  ready,
  capturing,
  onClick,
  showLabel = true,
  compact = false,
}: CameraShutterControlProps) {
  const ringSize = compact ? COMPACT_RING : FULL_RING;
  const stroke = compact ? 3 : 4;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const innerSize = compact ? "h-10 w-10" : "h-14 w-14";
  const buttonSize = compact ? "h-[3.25rem] w-[3.25rem]" : "h-[4.5rem] w-[4.5rem]";

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
  const dashOffset = circumference * (1 - arcProgress);

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={!ready || capturing}
        aria-label="Take photo"
        aria-busy={capturing}
        className={`relative flex ${buttonSize} items-center justify-center transition-transform active:scale-95 disabled:opacity-50`}
      >
        <svg
          className="absolute inset-0 h-full w-full -rotate-90"
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          aria-hidden
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke="rgb(24 24 27)"
            strokeWidth={stroke}
          />
          {showArc && (
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="rgb(34 197 94)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          )}
          {!showArc && ready && (
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="rgb(34 197 94 / 0.85)"
              strokeWidth={stroke}
            />
          )}
        </svg>
        <span
          className={`relative z-[1] ${innerSize} rounded-full bg-white shadow-inner`}
        />
      </button>
      {showLabel && (
        <span className="text-[9px] font-bold uppercase tracking-wide text-white">
          Take Photo
        </span>
      )}
    </div>
  );
}
