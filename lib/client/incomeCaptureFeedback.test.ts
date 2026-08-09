import { test } from "node:test";
import assert from "node:assert/strict";
import {
  incomeCapturePhase1Message,
  incomeCapturePhase2BlurryMessage,
  incomeCapturePhase2SuccessMessage,
  receiptQualifiesForIncomePhase2Success,
} from "./incomeCaptureFeedback.ts";

const copy = {
  phase1Scanning: "{form} added · Scanning…",
  phase2SuccessWithPayer: "{form} · {amount} from {payer}",
  phase2SuccessAmountOnly: "{form} · {amount} saved",
  phase2Blurry: "Couldn't read {form} — tap to resnap",
};

test("incomeCapturePhase1Message substitutes form type", () => {
  assert.equal(
    incomeCapturePhase1Message("1099-NEC", copy),
    "1099-NEC added · Scanning…",
  );
});

test("incomeCapturePhase2SuccessMessage includes payer when present", () => {
  const msg = incomeCapturePhase2SuccessMessage(
    {
      status: "done",
      category: "1099-NEC",
      merchant: "Acme Corp",
      amount: 48200,
      captureKind: "1099-NEC",
    },
    "1099-NEC",
    copy,
  );
  assert.equal(msg, "1099-NEC · $48,200.00 from Acme Corp");
});

test("incomeCapturePhase2SuccessMessage omits payer when missing", () => {
  const msg = incomeCapturePhase2SuccessMessage(
    {
      status: "done",
      category: "1099-K",
      merchant: "Scanning",
      amount: 1200,
      captureKind: "1099-K",
    },
    "1099-K",
    copy,
  );
  assert.equal(msg, "1099-K · $1,200.00 saved");
});

test("incomeCapturePhase2BlurryMessage substitutes form type", () => {
  assert.equal(
    incomeCapturePhase2BlurryMessage("1099-NEC", copy),
    "Couldn't read 1099-NEC — tap to resnap",
  );
});

test("receiptQualifiesForIncomePhase2Success requires done income row", () => {
  assert.equal(
    receiptQualifiesForIncomePhase2Success({
      status: "processing",
      category: "1099-NEC",
      captureKind: "1099-NEC",
    }),
    false,
  );
  assert.equal(
    receiptQualifiesForIncomePhase2Success({
      status: "done",
      category: "TRUCK GAS",
      captureKind: null,
    }),
    false,
  );
  assert.equal(
    receiptQualifiesForIncomePhase2Success({
      status: "done",
      category: undefined,
      captureKind: "1099-NEC",
    }),
    true,
  );
});
