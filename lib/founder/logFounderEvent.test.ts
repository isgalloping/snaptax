import assert from "node:assert/strict";
import { test } from "node:test";
import { logFounderEvent } from "./logFounderEvent.ts";

test("logFounderEvent emits key=value format", () => {
  const logs: string[] = [];
  const original = console.log;
  console.log = (msg: unknown) => logs.push(String(msg));

  try {
    logFounderEvent("founder_widget_impression", {
      source: "home",
      count: 3,
      skipped: null,
      hidden: undefined,
    });
  } finally {
    console.log = original;
  }

  assert.equal(logs.length, 1);
  const line = logs[0]!;
  assert.match(line, /^ts=/);
  assert.match(line, /level=info/);
  assert.match(line, /module=biz\.founder/);
  assert.match(line, /success=true/);
  assert.match(line, /event=founder_widget_impression/);
  assert.match(line, /source=home/);
  assert.match(line, /count=3/);
  assert.doesNotMatch(line, /skipped=/);
  assert.doesNotMatch(line, /hidden=/);
});
