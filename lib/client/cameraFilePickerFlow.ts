export type CameraFilePickerState = {
  cameraOpen: boolean;
  filePickerPending: boolean;
};

export type CameraFilePickerEvent =
  | "open-picker"
  | "file-selected"
  | "picker-cancelled";

export function nextCameraFilePickerState(
  _state: CameraFilePickerState,
  event: CameraFilePickerEvent,
): CameraFilePickerState {
  if (event === "open-picker") {
    return { cameraOpen: true, filePickerPending: true };
  }
  if (event === "file-selected" || event === "picker-cancelled") {
    return { cameraOpen: false, filePickerPending: false };
  }
  return _state;
}
