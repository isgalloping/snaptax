import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { maskEmailForDisplay } from "./maskEmail.ts";

describe("maskEmailForDisplay", () => {
  it("masks standard email with first 3 local chars", () => {
    assert.equal(maskEmailForDisplay("isgalloping@gmail.com"), "isg***@gmail.com");
  });

  it("uses all local chars when shorter than 3", () => {
    assert.equal(maskEmailForDisplay("ab@gmail.com"), "ab***@gmail.com");
    assert.equal(maskEmailForDisplay("a@b.co"), "a***@b.co");
  });

  it("returns *** for invalid email", () => {
    assert.equal(maskEmailForDisplay(""), "***");
    assert.equal(maskEmailForDisplay("invalid"), "***");
    assert.equal(maskEmailForDisplay("@gmail.com"), "***");
  });
});
