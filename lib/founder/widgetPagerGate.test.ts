import assert from "node:assert/strict";
import test from "node:test";
import { shouldHoldWidgetPagerForFounderCheck } from "./widgetPagerGate";

test("shouldHoldWidgetPagerForFounderCheck before auth or founder API", () => {
  assert.equal(shouldHoldWidgetPagerForFounderCheck(false, false), true);
  assert.equal(shouldHoldWidgetPagerForFounderCheck(true, false), true);
});

test("shouldHoldWidgetPagerForFounderCheck after founder API resolves", () => {
  assert.equal(shouldHoldWidgetPagerForFounderCheck(true, true), false);
});
