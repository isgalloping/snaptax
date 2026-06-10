import assert from "node:assert/strict";
import { test } from "node:test";
import { filedFlag, isReceiptFiled } from "./filedStatus.ts";

test("isReceiptFiled requires both season and date", () => {
  assert.equal(
    isReceiptFiled({ taxSeason: "2026", taxSeasonDate: new Date() }),
    true,
  );
  assert.equal(isReceiptFiled({ taxSeason: "2026", taxSeasonDate: null }), false);
  assert.equal(
    isReceiptFiled({ taxSeason: null, taxSeasonDate: new Date() }),
    false,
  );
  assert.equal(isReceiptFiled({ taxSeason: "  ", taxSeasonDate: new Date() }), false);
});

test("filedFlag maps to 0 or 1", () => {
  assert.equal(filedFlag({ taxSeason: "2026", taxSeasonDate: new Date() }), 1);
  assert.equal(filedFlag({ taxSeason: "2026", taxSeasonDate: null }), 0);
});
