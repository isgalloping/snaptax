export type CameraReturnView = "home" | "settings";

/** After closing the camera, restore Settings when capture was launched from there. */
export function viewAfterCameraClose(
  returnView: CameraReturnView | null,
): CameraReturnView {
  return returnView === "settings" ? "settings" : "home";
}
