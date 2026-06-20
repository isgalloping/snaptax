import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contentSha256 } from "./imageFingerprint.ts";
import { contentSha256FromBytes } from "./clientContentSha256.ts";

describe("clientContentSha256", () => {
  it("matches Node contentSha256 for the same bytes", async () => {
    const fixtures = [
      Buffer.from("same-receipt-bytes"),
      Buffer.from(""),
      Buffer.alloc(256, 0xab),
    ];
    for (const bytes of fixtures) {
      const nodeHex = contentSha256(bytes);
      const browserHex = await contentSha256FromBytes(
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      );
      assert.equal(browserHex, nodeHex);
    }
  });
});
