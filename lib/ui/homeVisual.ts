export const homeVisual = {
  /** Wealth hero — static asset under public/photo/ */
  heroImage: "/photo/hero.png",
  /** Left vignette + bottom fade — text legibility over photo */
  heroOverlay:
    "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 42%, rgba(0,0,0,0.05) 72%, transparent 100%), linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 55%, #000 100%)",
  /** Brand yellow tint — stacked above overlay (option C) */
  heroTint:
    "linear-gradient(180deg, rgba(234,179,8,0.18) 0%, rgba(0,0,0,0.55) 48%, #000 100%)",
  /** @deprecated alias — use heroTint */
  heroGradient:
    "linear-gradient(180deg, rgba(234,179,8,0.18) 0%, rgba(0,0,0,0.55) 48%, #000 100%)",
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
  snapCamera: {
    footerDock:
      "rounded-2xl border border-zinc-800/80 bg-zinc-950/95",
    footerColTile: "h-full min-h-[6.5rem] w-full rounded-xl",
    footerRowMin: "min-h-[6.5rem]",
    footerGridCols: "grid-cols-[20fr_35fr_25fr_20fr]",
    /** @deprecated fixed tile — use footerColTile in live dock */
    footerTile: "h-16 w-16 rounded-xl",
    footerTileRow: "h-16",
    batchTileOutline:
      "bg-black/40 border border-green-500/60",
    shutterOuter: "border-[6px] border-zinc-900",
    shutterRing: "ring-2 ring-green-500/90 ring-offset-2 ring-offset-black",
    badgeGlow:
      "shadow-[0_0_20px_rgba(34,197,94,0.55)] border border-green-500/40",
    gallerySelected: "ring-2 ring-white ring-offset-1 ring-offset-black/80",
    galleryLatest: "ring-2 ring-yellow-500 ring-offset-1 ring-offset-black/80",
    flashDoneFill:
      "bg-yellow-500 shadow-[0_0_16px_rgba(234,179,8,0.45)]",
    reviewDoneFill:
      "bg-green-950 border border-green-600/60 shadow-[0_0_12px_rgba(34,197,94,0.35)]",
    /** @deprecated use flashDoneFill */
    flashDone:
      "border-2 border-yellow-500/80 shadow-[0_0_16px_rgba(234,179,8,0.45)] bg-zinc-900/90",
    /** @deprecated use reviewDoneFill */
    reviewDone:
      "border border-green-500/50 shadow-[0_0_16px_rgba(34,197,94,0.35)] bg-zinc-900/90",
  },
  reviewControl: {
    size: "h-14 w-14",
    delete:
      "rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.45)] border border-red-500/60",
    resnap:
      "rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.45)] border border-red-500/60",
    accept:
      "rounded-full bg-green-600 shadow-[0_0_16px_rgba(34,197,94,0.45)] border border-green-500/60",
  },
  /** Outdoor touch — min 56px height for filter tabs */
  filterTab: {
    minHeight: "min-h-14",
    padding: "px-4 py-3",
    fontSize: "text-sm",
    gap: "gap-3",
    iconGap: "mr-1.5",
    countGap: "ml-1.5",
    barPadding: "py-1.5",
  },
} as const;

export type ReceiptVisualState =
  | "uploading"
  | "analyzing"
  | "paused"
  | "done"
  | "blurry";
