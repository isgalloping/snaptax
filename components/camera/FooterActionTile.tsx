"use client";

import type { ReactNode } from "react";
import { homeVisual } from "@/lib/ui/homeVisual";

interface FooterActionTileProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  /** Invisible spacer — same size, no interaction */
  placeholder?: boolean;
}

export function FooterActionTile({
  children,
  className = "",
  disabled = false,
  onClick,
  ariaLabel,
  placeholder = false,
}: FooterActionTileProps) {
  const tileClass = `${homeVisual.snapCamera.footerTile} flex shrink-0 flex-col items-center justify-center transition-transform active:scale-95 disabled:opacity-40 ${className}`;

  if (placeholder) {
    return (
      <div className={`${tileClass} pointer-events-none opacity-0`} aria-hidden>
        {children}
      </div>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={tileClass}
      >
        {children}
      </button>
    );
  }

  return <div className={tileClass}>{children}</div>;
}
