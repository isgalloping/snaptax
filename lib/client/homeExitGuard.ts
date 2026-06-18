import {
  DEFAULT_SWIPE_BACK_THRESHOLD_PX,
  SWIPE_BACK_HORIZONTAL_RATIO,
  shouldTriggerSwipeBack,
} from "./useSwipeBack";

export const DEFAULT_HOME_EXIT_EDGE_PX = 24;

export function isEdgeTouchStart(
  clientX: number,
  viewportWidth: number,
  edgePx = DEFAULT_HOME_EXIT_EDGE_PX,
): boolean {
  return clientX <= edgePx || clientX >= viewportWidth - edgePx;
}

export function shouldTriggerEdgeExitSwipe(
  dx: number,
  dy: number,
  thresholdPx = DEFAULT_SWIPE_BACK_THRESHOLD_PX,
): boolean {
  return shouldTriggerSwipeBack(dx, dy, thresholdPx);
}

export function isSnapNavPopState(state: unknown): boolean {
  if (!state || typeof state !== "object") return false;
  return typeof (state as { snap1099?: string }).snap1099 === "string";
}

/** True when popstate would leave Snap1099 history (app exit boundary). */
export function shouldConfirmExitFromPopState(
  state: unknown,
  atHomeRoot: boolean,
): boolean {
  if (!atHomeRoot) return false;
  return !isSnapNavPopState(state);
}

export { SWIPE_BACK_HORIZONTAL_RATIO };
