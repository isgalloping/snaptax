import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeFounderStatus } from "./founderProgram.ts";

describe("normalizeFounderStatus", () => {
  it("preserves active status", () => {
    assert.equal(normalizeFounderStatus("active"), "active");
  });

  it("preserves lapsed status", () => {
    assert.equal(normalizeFounderStatus("lapsed"), "lapsed");
  });

  it("maps null to none", () => {
    assert.equal(normalizeFounderStatus(null), "none");
  });

  it("maps undefined to none", () => {
    assert.equal(normalizeFounderStatus(undefined), "none");
  });

  it("maps unknown values to none", () => {
    assert.equal(normalizeFounderStatus("pending"), "none");
    assert.equal(normalizeFounderStatus(""), "none");
    assert.equal(normalizeFounderStatus("none"), "none");
  });
});
