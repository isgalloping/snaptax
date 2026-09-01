import {
  peekPendingIncomeCapture,
  type IncomeCaptureKind,
} from "@/lib/export/incomeCapture";

export function resolveReceiptCaptureKind(
  activeIntent: IncomeCaptureKind | null,
): IncomeCaptureKind | null {
  return activeIntent ?? peekPendingIncomeCapture();
}
