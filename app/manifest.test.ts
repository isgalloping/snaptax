import assert from "node:assert/strict";
import { describe, it } from "node:test";
import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("opens installed app at /app", () => {
    const data = manifest();
    assert.equal(data.start_url, "/app");
    assert.equal(data.scope, "/app");
    assert.equal(data.id, "/app");
  });
});
