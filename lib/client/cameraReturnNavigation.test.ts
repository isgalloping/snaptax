import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { viewAfterCameraClose } from "./cameraReturnNavigation.ts";

describe("cameraReturnNavigation", () => {
  it("returns settings when capture was launched from settings", () => {
    assert.equal(viewAfterCameraClose("settings"), "settings");
  });

  it("returns home when capture was launched from home or unset", () => {
    assert.equal(viewAfterCameraClose("home"), "home");
    assert.equal(viewAfterCameraClose(null), "home");
  });
});
