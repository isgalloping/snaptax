import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MARKETING_PAYMENT_CHANNELS } from "@/lib/marketing/paymentChannels";

describe("MARKETING_PAYMENT_CHANNELS", () => {
  it("lists the five checkout methods shown on marketing pricing", () => {
    assert.deepEqual(
      MARKETING_PAYMENT_CHANNELS.map((channel) => channel.id),
      ["visa", "mastercard", "amex", "apple-pay", "google-pay"],
    );
  });
});
