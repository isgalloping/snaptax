import type { Receipt } from "@/lib/types";

export type ReceiptListIcon = {
  emoji: string;
  ariaLabel: string;
  spin?: boolean;
};

const CATEGORY_EMOJI: Record<string, string> = {
  "TRUCK GAS": "⛽",
  TOOLS: "🛠️",
  SUPPLIES: "🛠️",
  MATERIALS: "🛠️",
  MEALS: "🍔",
  EQUIPMENT: "🔧",
  OTHER: "🧾",
  PERSONAL: "🧾",
};

export function getReceiptListIcon(
  receipt: Receipt,
  opts?: { syncStuck?: boolean },
): ReceiptListIcon {
  if (receipt.status === "processing") {
    if (receipt.pendingUpload) {
      if (opts?.syncStuck) {
        return { emoji: "⚠️", ariaLabel: "Upload paused" };
      }
      return { emoji: "☁️", ariaLabel: "Uploading receipt" };
    }
    if (opts?.syncStuck) {
      return { emoji: "⚠️", ariaLabel: "Analysis paused" };
    }
    return { emoji: "⚙️", ariaLabel: "Analyzing receipt", spin: true };
  }

  if (receipt.status === "blurry") {
    return { emoji: "❌", ariaLabel: "Blurry receipt" };
  }

  const key = (receipt.category ?? "OTHER").toUpperCase().trim();
  const emoji = CATEGORY_EMOJI[key] ?? CATEGORY_EMOJI.OTHER;
  return { emoji, ariaLabel: receipt.category ?? "Receipt" };
}
