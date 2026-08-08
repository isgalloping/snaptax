import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

describe("buildMarketingMetadata", () => {
  it("uses custom imagePath when provided", () => {
    const meta = buildMarketingMetadata({
      title: "T",
      description: "D",
      path: "/tax-deductions/electrician",
      imagePath: "/marketing/seo/electrician-worker.png",
      imageAlt: "Electrician working on an electrical panel",
    });
    const og = meta.openGraph?.images;
    assert.ok(Array.isArray(og));
    assert.match(String((og[0] as { url: string }).url), /electrician-worker/);
  });

  it("defaults to hero-phone when imagePath omitted", () => {
    const meta = buildMarketingMetadata({
      title: "T",
      description: "D",
      path: "/features",
    });
    const images = meta.twitter?.images;
    assert.ok(Array.isArray(images));
    assert.match(String(images[0]), /hero-phone/);
  });
});
