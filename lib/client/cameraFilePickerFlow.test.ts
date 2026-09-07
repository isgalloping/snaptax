import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  nextCameraFilePickerState,
  type CameraFilePickerState,
} from "./cameraFilePickerFlow.ts";

describe("cameraFilePickerFlow", () => {
  it("keeps camera open while launching gallery fallback so income intent survives file selection", () => {
    const before: CameraFilePickerState = {
      cameraOpen: true,
      filePickerPending: false,
    };

    const pending = nextCameraFilePickerState(before, "open-picker");
    assert.deepEqual(pending, {
      cameraOpen: true,
      filePickerPending: true,
    });

    assert.deepEqual(nextCameraFilePickerState(pending, "file-selected"), {
      cameraOpen: false,
      filePickerPending: false,
    });
  });

  it("closes a pending gallery fallback when the picker is cancelled", () => {
    const pending: CameraFilePickerState = {
      cameraOpen: true,
      filePickerPending: true,
    };

    assert.deepEqual(nextCameraFilePickerState(pending, "picker-cancelled"), {
      cameraOpen: false,
      filePickerPending: false,
    });
  });

  it("treats a direct no-camera picker as an active camera session until cancellation", () => {
    const before: CameraFilePickerState = {
      cameraOpen: false,
      filePickerPending: false,
    };

    const pending = nextCameraFilePickerState(before, "open-picker");
    assert.deepEqual(pending, {
      cameraOpen: true,
      filePickerPending: true,
    });

    assert.deepEqual(nextCameraFilePickerState(pending, "picker-cancelled"), {
      cameraOpen: false,
      filePickerPending: false,
    });
  });
});
