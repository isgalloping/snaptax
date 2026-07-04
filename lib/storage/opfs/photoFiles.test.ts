import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  opfsFullRelPath,
  opfsThumbRelPath,
} from "@/lib/storage/opfs/photoFiles";

describe("opfs photo paths", () => {
  it("builds full and thumb paths under snaptax/photos", () => {
    assert.equal(
      opfsFullRelPath("abc-123"),
      "snaptax/photos/abc-123/full.v1.enc",
    );
    assert.equal(
      opfsThumbRelPath("abc-123"),
      "snaptax/photos/abc-123/thumb.v1.enc",
    );
  });
});
