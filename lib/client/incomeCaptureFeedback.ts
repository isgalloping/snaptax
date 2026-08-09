import type { IncomeCaptureKind } from "@/lib/export/incomeCapture";
import { isIncomeDocument } from "@/lib/export/incomeDocuments";
import { formatCurrency } from "@/lib/format";
import type { Receipt } from "@/lib/types";

export type IncomeCaptureFeedbackCopy = {
  phase1Scanning: string;
  phase2SuccessWithPayer: string;
  phase2SuccessAmountOnly: string;
  phase2Blurry: string;
};

function replaceForm(template: string, form: IncomeCaptureKind): string {
  return template.replaceAll("{form}", form);
}

export function incomeCapturePhase1Message(
  kind: IncomeCaptureKind,
  copy: IncomeCaptureFeedbackCopy,
): string {
  return replaceForm(copy.phase1Scanning, kind);
}

type IncomeCaptureFeedbackReceipt = Pick<
  Receipt,
  "status" | "merchant" | "amount" | "category" | "captureKind"
>;

export function incomeCapturePhase2SuccessMessage(
  receipt: IncomeCaptureFeedbackReceipt,
  kind: IncomeCaptureKind,
  copy: IncomeCaptureFeedbackCopy,
): string | null {
  if (!receiptQualifiesForIncomePhase2Success(receipt)) return null;

  const amount = formatCurrency(receipt.amount ?? 0);
  const payer = receipt.merchant?.trim();
  const hasPayer =
    payer &&
    payer !== "Scanning" &&
    payer.toLowerCase() !== "unknown merchant";

  if (hasPayer) {
    return replaceForm(copy.phase2SuccessWithPayer, kind)
      .replace("{amount}", amount)
      .replace("{payer}", payer);
  }

  return replaceForm(copy.phase2SuccessAmountOnly, kind).replace(
    "{amount}",
    amount,
  );
}

export function incomeCapturePhase2BlurryMessage(
  kind: IncomeCaptureKind,
  copy: IncomeCaptureFeedbackCopy,
): string {
  return replaceForm(copy.phase2Blurry, kind);
}

export function receiptQualifiesForIncomePhase2Success(
  receipt: Pick<Receipt, "status" | "category" | "captureKind">,
): boolean {
  return (
    receipt.status === "done" &&
    (isIncomeDocument(receipt) || Boolean(receipt.captureKind))
  );
}
