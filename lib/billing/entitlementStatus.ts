export type SeasonEntitlementStatus = "active" | "disputed" | "refunded";
export type EntitlementAdjustmentAction =
  | "refund"
  | "chargeback"
  | "chargeback_warning"
  | "chargeback_reverse";

export function nextEntitlementStatus(input: {
  current: SeasonEntitlementStatus;
  action: EntitlementAdjustmentAction;
  adjustmentStatus?: string | null;
}): { next: SeasonEntitlementStatus; applied: boolean; reason: string } {
  const { current, action } = input;
  if (current === "refunded") {
    return { next: "refunded", applied: false, reason: "refunded_terminal" };
  }
  if (action === "refund") {
    if (input.adjustmentStatus !== "approved") {
      return {
        next: current,
        applied: false,
        reason: "refund_not_approved",
      };
    }
    return { next: "refunded", applied: true, reason: "refund_approved" };
  }
  if (action === "chargeback" || action === "chargeback_warning") {
    if (current === "disputed") {
      return { next: "disputed", applied: false, reason: "already_disputed" };
    }
    return { next: "disputed", applied: true, reason: action };
  }
  if (action === "chargeback_reverse") {
    if (current !== "disputed") {
      return {
        next: current,
        applied: false,
        reason: "reverse_not_disputed",
      };
    }
    return { next: "active", applied: true, reason: "chargeback_reverse" };
  }
  return { next: current, applied: false, reason: "unknown_action" };
}
