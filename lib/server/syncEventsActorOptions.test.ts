import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SYNC_EVENTS_ACTOR_OPTIONS } from "./syncEventsActorOptions.ts";

describe("SYNC_EVENTS_ACTOR_OPTIONS", () => {
  it("requires Google re-auth for writes from a bound ghost", () => {
    assert.equal(SYNC_EVENTS_ACTOR_OPTIONS.requireWrite, true);
  });
});
