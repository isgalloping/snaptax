import assert from "node:assert/strict";
import sharp from "sharp";
import { describe, it } from "node:test";
import {
  computeImageFingerprint,
  contentSha256,
  findSimilarFingerprintMatch,
  hammingDistanceHex,
} from "./imageFingerprint.ts";

describe("imageFingerprint", () => {
  it("contentSha256 is stable for identical bytes", () => {
    const bytes = Buffer.from("same-receipt-bytes");
    assert.equal(contentSha256(bytes), contentSha256(bytes));
    assert.notEqual(contentSha256(bytes), contentSha256(Buffer.from("other")));
  });

  it("hammingDistanceHex counts bit differences", () => {
    assert.equal(hammingDistanceHex("0000000000000000", "0000000000000001"), 1);
    assert.equal(hammingDistanceHex("ffffffffffffffff", "0000000000000000"), 64);
  });

  it("findSimilarFingerprintMatch respects excludeId", () => {
    const match = findSimilarFingerprintMatch(
      [{ id: "a", imageFingerprint: "0000000000000000" }],
      "0000000000000001",
      "a",
    );
    assert.equal(match, null);
  });

  it("findSimilarFingerprintMatch finds close fingerprints", () => {
    const match = findSimilarFingerprintMatch(
      [{ id: "dup", imageFingerprint: "0000000000000003" }],
      "0000000000000001",
      null,
      3,
    );
    assert.deepEqual(match, { id: "dup" });
  });

  it("computeImageFingerprint is stable for the same bytes", async () => {
    const bytes = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 3,
        background: { r: 120, g: 80, b: 40 },
      },
    })
      .png()
      .toBuffer();
    const a = await computeImageFingerprint(bytes);
    const b = await computeImageFingerprint(bytes);
    assert.equal(a, b);
    assert.match(a, /^[0-9a-f]{16}$/);
  });
});
