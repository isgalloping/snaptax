import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { captureGalleryFileBeforeCameraClose } from "./SnapButton.tsx";

describe("captureGalleryFileBeforeCameraClose", () => {
  it("waits for the gallery capture before closing the camera", async () => {
    const events: string[] = [];
    const file = new File(["1099"], "1099.jpg", { type: "image/jpeg" });

    await captureGalleryFileBeforeCameraClose(
      file,
      async () => {
        events.push("capture:start");
        await Promise.resolve();
        events.push("capture:done");
      },
      () => {
        events.push("camera:close");
      },
    );

    assert.deepEqual(events, [
      "capture:start",
      "capture:done",
      "camera:close",
    ]);
  });

  it("leaves the camera open when the gallery picker is cancelled", async () => {
    let closeCount = 0;

    await captureGalleryFileBeforeCameraClose(
      undefined,
      () => {
        throw new Error("capture should not run");
      },
      () => {
        closeCount += 1;
      },
    );

    assert.equal(closeCount, 0);
  });
});
