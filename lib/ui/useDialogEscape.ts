"use client";

import { useEffect } from "react";

/** Close modal/sheet on Escape (WCAG 2.1.2 no keyboard trap). */
export function useDialogEscape(active: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!active) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [active, onClose]);
}
