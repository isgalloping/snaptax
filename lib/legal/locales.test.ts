import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LEGAL_CONTACT_EMAIL } from "./locales.ts";

describe("LEGAL_CONTACT_EMAIL", () => {
  it("is the public Gmail contact address", () => {
    assert.equal(LEGAL_CONTACT_EMAIL, "snaptax.lightxforge@gmail.com");
  });
});
