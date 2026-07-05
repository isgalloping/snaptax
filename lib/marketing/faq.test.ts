import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MARKETING_COPY } from "@/lib/marketing/copy";

describe("marketing faq preview", () => {
  it("shows six grid items in mockup order", () => {
    assert.deepEqual(
      MARKETING_COPY.faq.previewItems.map((item) => item.question),
      [
        "Is SnapTax a subscription?",
        "Can I get a refund?",
        "Is my data secure?",
        "Will taxes be added at checkout?",
        "Can I export my tax reports?",
        "Can I use SnapTax offline?",
      ],
    );
  });

  it("uses centered preview footer copy", () => {
    assert.equal(MARKETING_COPY.faq.viewAll, "View all questions →");
  });
});
