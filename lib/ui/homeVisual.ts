export const homeVisual = {
  heroGradient:
    "linear-gradient(180deg, rgba(234,179,8,0.18) 0%, rgba(0,0,0,0.75) 45%, #000 100%)",
  status: {
    analyzing: "text-blue-400",
    uploading: "text-yellow-400",
    paused: "text-yellow-500",
    done: "text-green-400",
  },
  snap: {
    height: "h-[140px]",
    maxHeight: "max-h-[18vh]",
  },
  /** +15% over baseline px-3 py-1.5 text-xs gap-2 — outdoor touch target */
  filterTab: {
    padding: "px-[0.8625rem] py-[0.43125rem]",
    fontSize: "text-[0.8625rem]",
    gap: "gap-[0.575rem]",
    iconGap: "mr-[0.2875rem]",
    countGap: "ml-[0.2875rem]",
  },
} as const;

export type ReceiptVisualState =
  | "uploading"
  | "analyzing"
  | "paused"
  | "done"
  | "blurry";
