"use client";

import { useEffect, useState } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { SHUTTER_COOLDOWN_MS } from "@/lib/camera/shutterCooldown";

const COMPACT_RING = 56;
const FULL_RING = 72;
const HERO_RING = 96;

type ShutterSize = "compact" | "full" | "hero";

interface CameraShutterControlProps {
  ready: boolean;
  capturing: boolean;
  onClick: () => void;
  showLabel?: boolean;
  /** @deprecated use size="compact" */
  compact?: boolean;
  size?: ShutterSize;
}

function ringConfig(size: ShutterSize) {
  switch (size) {
    case "hero":
      return {
        ring: HERO_RING,
        stroke: 4,
        inner: "h-20 w-20",
        button: "h-24 w-24",
      };
    case "compact":
      return {
        ring: COMPACT_RING,
        stroke: 3,
        inner: "h-11 w-11",
        button: "h-14 w-14",
      };
    default:
      return {
        ring: FULL_RING,
        stroke: 4,
        inner: "h-14 w-14",
        button: "h-[4.5rem] w-[4.5rem]",
      };
  }
}

export function CameraShutterControl({
  ready,
  capturing,
  onClick,
  showLabel = true,
  compact = false,
  size,
}: CameraShutterControlProps) {
  const copy = useUserCopy().camera;
  const resolvedSize: ShutterSize = size ?? (compact ? "compact" : "full");
  const { ring: ringSize, stroke, inner: innerSize, button: buttonSize } =
    ringConfig(resolvedSize);
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

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
        aria-label={copy.takePhotoAria}
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
          {copy.takePhoto}
        </span>
      )}
    </div>
  );
}
