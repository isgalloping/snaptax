/** True when checkout-intent rejects because the season export is already paid. */
export function isSeasonAlreadyPaidCheckoutResponse(
  status: number,
  errorCode: string | null,
): boolean {
  return status === 409 && errorCode === "SEASON_ALREADY_PAID";
}
