/** Hold widget pager until founder visibility is known (avoids deadline flash). */
export function shouldHoldWidgetPagerForFounderCheck(
  authHydrated: boolean,
  founderCheckComplete: boolean,
): boolean {
  return !authHydrated || !founderCheckComplete;
}
