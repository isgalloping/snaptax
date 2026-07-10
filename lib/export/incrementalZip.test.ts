import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createIncrementalZip } from "@/lib/export/incrementalZip";
import { unzipSync } from "fflate";

describe("createIncrementalZip", () => {
  it("builds a valid zip from stored files", () => {
    const zip = createIncrementalZip();
    zip.addStoredFile("hello.txt", new TextEncoder().encode("hello"));
    zip.addStoredFile("data.csv", new TextEncoder().encode("a,b\n1,2"));
    return zip.finish().then((chunks) => {
      assert.ok(chunks.length >= 1);
      const merged = new Uint8Array(
        chunks.reduce((sum, chunk) => sum + chunk.length, 0),
      );
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      const entries = unzipSync(merged);
      assert.equal(new TextDecoder().decode(entries["hello.txt"]), "hello");
      assert.match(new TextDecoder().decode(entries["data.csv"]), /a,b/);
    });
  });
});
