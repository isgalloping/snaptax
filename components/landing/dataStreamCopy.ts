export const DATA_STREAM_CHECKLIST_TITLE =
  "Loading your tax-saving toolkit... >>>";

export const DATA_STREAM_CHECKLIST_ITEMS = [
  {
    icon: "database",
    label: "IRS deduction database loaded",
  },
  {
    icon: "gauge",
    label: "Mileage categories loaded",
  },
  {
    icon: "briefcase",
    label: "Work equipment deductions loaded",
  },
  {
    icon: "camera",
    label: "Receipt scanner ready",
  },
  {
    icon: "shield",
    label: "Secure receipt vault online",
  },
] as const;

export const DATA_STREAM_LOG_LINES = [
  "Loading IRS categories...",
  "Travel expenses loaded",
  "Fuel deductions loaded",
  "Equipment deductions loaded",
  "Receipt vault online",
  "AI scanner ready",
  "You're one photo away from tax savings.",
] as const;

export const DATA_STREAM_FOOTER_COLUMNS = [
  {
    icon: "shield",
    title: "100% PRIVATE & SECURE",
    subcopy: "Encrypted sync when online. Local cache on device.",
  },
  {
    icon: "offline",
    title: "WORKS OFFLINE",
    subcopy: "Snap and queue without signal.",
  },
  {
    icon: "workers",
    title: "BUILT FOR WORKERS",
    subcopy: "Construction. Trucking. Delivery.",
  },
] as const;

export type DataStreamIconName =
  | (typeof DATA_STREAM_CHECKLIST_ITEMS)[number]["icon"]
  | (typeof DATA_STREAM_FOOTER_COLUMNS)[number]["icon"];
