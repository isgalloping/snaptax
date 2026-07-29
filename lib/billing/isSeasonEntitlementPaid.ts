export function isSeasonEntitlementPaid(
  status: string | null | undefined,
): boolean {
  return status === "active";
}
