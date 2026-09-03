import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  beginGalleryFallbackSelection,
  finishGalleryFallbackSelection,
  type GalleryFallbackState,
} from "./SnapButton";

describe("SnapButton gallery fallback flow", () => {
  it("keeps the camera open until fallback capture resolves", async () => {
    const state: GalleryFallbackState = { pending: false };
    let pickerClicks = 0;
    let closeCalls = 0;
    let releaseCapture!: () => void;
    const captureSettled = new Promise<void>((resolve) => {
      releaseCapture = resolve;
    });

    beginGalleryFallbackSelection(state, () => {
      pickerClicks += 1;
      return true;
    });

    assert.equal(pickerClicks, 1);
    assert.equal(state.pending, true);
    assert.equal(closeCalls, 0);

    const done = finishGalleryFallbackSelection(
      state,
      new File(["1099"], "1099-nec.jpg", { type: "image/jpeg" }),
      async () => {
        await captureSettled;
      },
      () => {
        closeCalls += 1;
      },
    );

    await Promise.resolve();

    assert.equal(closeCalls, 0);
    assert.equal(state.pending, true);

    releaseCapture();
    await done;

    assert.equal(closeCalls, 1);
    assert.equal(state.pending, false);
  });

  it("does not close the camera for non-fallback file input captures", async () => {
    const state: GalleryFallbackState = { pending: false };
    let closeCalls = 0;

    await finishGalleryFallbackSelection(
      state,
      new File(["receipt"], "receipt.jpg", { type: "image/jpeg" }),
      async () => {},
      () => {
        closeCalls += 1;
      },
    );

    assert.equal(closeCalls, 0);
  });
});
