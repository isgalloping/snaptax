type FounderEventName =
  | "founder_widget_impression"
  | "founder_widget_tap"
  | "founder_sheet_view"
  | "founder_google_gate"
  | "founder_checkout_start"
  | "founder_purchase_fail";

export function logFounderEvent(
  name: FounderEventName,
  meta: Record<string, string | number | boolean | null | undefined> = {},
): void {
  const parts = [
    `ts=${new Date().toISOString()}`,
    "level=info",
    "module=biz.founder",
    "success=true",
    `event=${name}`,
    ...Object.entries(meta)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${String(v)}`),
  ];
  console.log(parts.join(" "));
}
