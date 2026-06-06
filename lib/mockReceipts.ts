import type { Receipt } from "./types";
import { utcDaysAgo, utcNow } from "@/lib/time/utc";

const MERCHANTS = [
  "Home Depot",
  "Shell Gas",
  "Lowes Supplies",
  "Harbor Freight",
  "AutoZone",
  "Walmart",
];

const CATEGORIES = [
  "TRUCK GAS",
  "TOOLS",
  "SUPPLIES",
  "EQUIPMENT",
  "MATERIALS",
] as const;

export function createSeedReceipts(): Receipt[] {
  const today = utcNow();
  const yesterday = utcDaysAgo(1);

  return [
    {
      id: "seed-1",
      status: "done",
      amount: 45.2,
      merchant: "Shell Gas",
      category: "TRUCK GAS",
      timestamp: today,
    },
    {
      id: "seed-2",
      status: "done",
      amount: 120,
      merchant: "Lowes Supplies",
      category: "TOOLS",
      timestamp: yesterday,
    },
  ];
}

export function mockProcessReceipt(): Pick<
  Receipt,
  "status" | "amount" | "merchant" | "category"
> {
  if (Math.random() < 0.08) {
    return { status: "blurry" };
  }

  const merchant = MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)];
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const amount = Math.round((Math.random() * 180 + 15) * 100) / 100;

  return { status: "done", amount, merchant, category };
}

export const INITIAL_TAX_SAVED = 1420.5;
