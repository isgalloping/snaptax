import type { EntitlementAdjustmentAction } from "@/lib/billing/entitlementStatus";

export type ParsedPaddleAdjustment = {
  transactionId: string;
  adjustmentId: string | null;
  action: EntitlementAdjustmentAction;
  adjustmentStatus: string | null;
};

const ACTIONS = new Set<string>([
  "refund",
  "chargeback",
  "chargeback_warning",
  "chargeback_reverse",
]);

export function parsePaddleAdjustmentPayload(
  payload: unknown,
): ParsedPaddleAdjustment | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const transactionId =
    typeof data.transaction_id === "string"
      ? data.transaction_id.trim()
      : "";
  if (!transactionId) return null;

  const actionRaw = typeof data.action === "string" ? data.action.trim() : "";
  if (!ACTIONS.has(actionRaw)) return null;

  const adjustmentId =
    typeof data.id === "string" && data.id.length > 0 ? data.id : null;
  const adjustmentStatus =
    typeof data.status === "string" ? data.status.trim() : null;

  return {
    transactionId,
    adjustmentId,
    action: actionRaw as EntitlementAdjustmentAction,
    adjustmentStatus,
  };
}
