import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { displayInitials } from "@/lib/user/displayInitials";

describe("displayInitials", () => {
  it("uses first two name tokens", () => {
    assert.equal(displayInitials("John Contractor", "j@x.com"), "JC");
  });

  it("single name uses one letter", () => {
    assert.equal(displayInitials("Madonna", "m@x.com"), "M");
  });

  it("falls back to email when name empty", () => {
    assert.equal(displayInitials("", "john@example.com"), "J");
  });

  it("handles whitespace-only name", () => {
    assert.equal(displayInitials("   ", "ab@test.com"), "A");
  });
});
