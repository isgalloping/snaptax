import { test } from "node:test";
import assert from "node:assert/strict";
import { isSeasonAlreadyPaidCheckoutResponse } from "./isSeasonAlreadyPaidCheckoutResponse.ts";

test("isSeasonAlreadyPaidCheckoutResponse matches 409 SEASON_ALREADY_PAID", () => {
  assert.equal(isSeasonAlreadyPaidCheckoutResponse(409, "SEASON_ALREADY_PAID"), true);
});

test("isSeasonAlreadyPaidCheckoutResponse rejects other codes and statuses", () => {
  assert.equal(isSeasonAlreadyPaidCheckoutResponse(409, "GOOGLE_LOGIN_REQUIRED"), false);
  assert.equal(isSeasonAlreadyPaidCheckoutResponse(402, "SEASON_ALREADY_PAID"), false);
  assert.equal(isSeasonAlreadyPaidCheckoutResponse(409, null), false);
});
