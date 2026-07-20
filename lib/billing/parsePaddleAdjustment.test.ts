import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePaddleAdjustmentPayload } from "./parsePaddleAdjustment.ts";

describe("parsePaddleAdjustmentPayload", () => {
  it("parses approved refund", () => {
    assert.deepEqual(
      parsePaddleAdjustmentPayload({
        data: {
          id: "adj_1",
          action: "refund",
          status: "approved",
          transaction_id: "txn_1",
        },
      }),
      {
        transactionId: "txn_1",
        adjustmentId: "adj_1",
        action: "refund",
        adjustmentStatus: "approved",
      },
    );
  });

  it("returns null without transaction_id", () => {
    assert.equal(
      parsePaddleAdjustmentPayload({
        data: { action: "refund", status: "approved" },
      }),
      null,
    );
  });

  it("parses chargeback_warning", () => {
    const parsed = parsePaddleAdjustmentPayload({
      data: {
        id: "adj_2",
        action: "chargeback_warning",
        transaction_id: "txn_9",
      },
    });
    assert.equal(parsed?.action, "chargeback_warning");
  });
});
