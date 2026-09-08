export type CameraReturnView = "home" | "settings";

export type CameraReturnNavigationOptions = {
  incomeCaptureCompleted?: boolean;
};

/** After closing the camera, restore Settings when capture was launched from there. */
export function viewAfterCameraClose(
  returnView: CameraReturnView | null,
  options?: CameraReturnNavigationOptions,
): CameraReturnView {
  if (options?.incomeCaptureCompleted) return "home";
  return returnView === "settings" ? "settings" : "home";
}
