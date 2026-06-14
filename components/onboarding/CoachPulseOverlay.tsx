"use client";

type CoachPulseVariant = "default" | "export";

interface CoachPulseOverlayProps {
  variant?: CoachPulseVariant;
  className?: string;
}

export function CoachPulseOverlay({
  variant = "default",
  className = "rounded-xl",
}: CoachPulseOverlayProps) {
  const pulseClass =
    variant === "export"
      ? "snap-focus-ring__pulse snap-focus-ring__pulse--export"
      : "snap-focus-ring__pulse";

  return (
    <div
      className={`${pulseClass} pointer-events-none absolute inset-0 ${className}`}
      aria-hidden
    />
  );
}
