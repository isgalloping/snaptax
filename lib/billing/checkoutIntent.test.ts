import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CHECKOUT_INTENT_TTL_MS,
  isCheckoutIntentExpired,
} from "./checkoutIntent";

describe("checkoutIntent helpers", () => {
  it("defines 15 minute TTL", () => {
    assert.equal(CHECKOUT_INTENT_TTL_MS, 15 * 60 * 1000);
  });

  it("detects expired intents", () => {
    const now = new Date("2026-06-13T12:00:00.000Z");
    const expiresAt = new Date("2026-06-13T11:59:59.000Z");
    assert.equal(isCheckoutIntentExpired(expiresAt, now), true);
    assert.equal(
      isCheckoutIntentExpired(new Date("2026-06-13T12:00:01.000Z"), now),
      false,
    );
  });
});
