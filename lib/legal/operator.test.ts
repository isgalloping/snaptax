import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LEGAL_BRAND_NAME,
  LEGAL_MAILING_ADDRESS,
  LEGAL_OPERATOR_NAME,
} from "./operator.ts";

describe("legal operator constants", () => {
  it("exports approved operator and brand", () => {
    assert.equal(LEGAL_OPERATOR_NAME, "Gang Huang");
    assert.equal(LEGAL_MAILING_ADDRESS, "Hong Kong");
    assert.equal(LEGAL_BRAND_NAME, "SnapTax");
  });
});
