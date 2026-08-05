import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isClientReceiptDeleteAllowed } from "./receiptDeletePolicy.ts";

describe("isClientReceiptDeleteAllowed", () => {
  it("allows unfiled done receipts", () => {
    assert.equal(
      isClientReceiptDeleteAllowed({
        taxSeason: undefined,
        taxSeasonDate: undefined,
      }),
      true,
    );
  });

  it("blocks filed receipts", () => {
    assert.equal(
      isClientReceiptDeleteAllowed({
        taxSeason: "2026",
        taxSeasonDate: new Date("2026-04-01T00:00:00.000Z"),
      }),
      false,
    );
  });

  it("blocks onboarding demo receipts", () => {
    assert.equal(
      isClientReceiptDeleteAllowed({
        isOnboardingDemo: true,
      }),
      false,
    );
  });
});
