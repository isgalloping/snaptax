"use client";

import type { Industry } from "@/lib/types";
import type { HomeWidgetsData } from "@/lib/home/computeHomeWidgets";
import { PrivacyTrustOverlay } from "./PrivacyTrustOverlay";
import { DeadlineDetailOverlay } from "./DeadlineDetailOverlay";
import { MissingDeductionsOverlay } from "./MissingDeductionsOverlay";
import { MissingDeductionItemOverlay } from "./MissingDeductionItemOverlay";

export type HomeOverlay =
  | null
  | "privacy-trust"
  | "deadline-detail"
  | "missing-deductions"
  | { type: "missing-deduction-item"; hintId: string };

interface HomeOverlayHostProps {
  overlay: NonNullable<HomeOverlay>;
  widgetsData: HomeWidgetsData;
  industry: Industry | null;
  onClose: () => void;
  onNavigate: (overlay: HomeOverlay) => void;
  onStartTracking: () => void;
}

export function HomeOverlayHost({
  overlay,
  widgetsData,
  onClose,
  onNavigate,
  onStartTracking,
}: HomeOverlayHostProps) {
  if (overlay === "privacy-trust") {
    return <PrivacyTrustOverlay onClose={onClose} />;
  }

  if (overlay === "deadline-detail") {
    return <DeadlineDetailOverlay data={widgetsData.deadline} onBack={onClose} />;
  }

  if (overlay === "missing-deductions") {
    return (
      <MissingDeductionsOverlay
        data={widgetsData.missing}
        onBack={onClose}
        onSelectItem={(hintId) => onNavigate({ type: "missing-deduction-item", hintId })}
      />
    );
  }

  if (overlay.type === "missing-deduction-item") {
    const item = widgetsData.missing.missing.find((m) => m.hint.id === overlay.hintId);
    if (!item) {
      return null;
    }
    return (
      <MissingDeductionItemOverlay
        item={item}
        onBack={() => onNavigate("missing-deductions")}
        onStartTracking={onStartTracking}
      />
    );
  }

  return null;
}
