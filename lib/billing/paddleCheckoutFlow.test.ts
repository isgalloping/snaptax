import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPaddleCheckoutClosed,
  isPaddleCheckoutCompleted,
  runPaddleCheckoutCompletedFlow,
} from "./paddleCheckoutFlow.ts";

describe("paddleCheckoutFlow", () => {
  it("detects checkout.completed and checkout.closed", () => {
    assert.equal(isPaddleCheckoutCompleted({ name: "checkout.completed" }), true);
    assert.equal(isPaddleCheckoutClosed({ name: "checkout.closed" }), true);
    assert.equal(isPaddleCheckoutCompleted({ name: "checkout.closed" }), false);
  });

  it("closes checkout and returns to app before running onPaid", async () => {
    const order: string[] = [];

    const handled = runPaddleCheckoutCompletedFlow({
      alreadyHandled: false,
      closeCheckout: () => order.push("close"),
      returnToApp: () => order.push("return"),
      onPaid: async () => {
        order.push("paid");
      },
    });

    assert.equal(handled, true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(order, ["close", "return", "paid"]);
  });

  it("ignores duplicate checkout.completed", () => {
    const order: string[] = [];

    const first = runPaddleCheckoutCompletedFlow({
      alreadyHandled: false,
      closeCheckout: () => order.push("close"),
      returnToApp: () => order.push("return"),
      onPaid: async () => {},
    });
    const second = runPaddleCheckoutCompletedFlow({
      alreadyHandled: first,
      closeCheckout: () => order.push("close2"),
      returnToApp: () => order.push("return2"),
      onPaid: async () => {},
    });

    assert.equal(second, false);
    assert.deepEqual(order, ["close", "return"]);
  });
});
