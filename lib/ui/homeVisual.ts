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
    shutterOuter: "border-[6px] border-zinc-900",
    shutterRing: "ring-2 ring-green-500/90 ring-offset-2 ring-offset-black",
    badgeGlow:
      "shadow-[0_0_20px_rgba(34,197,94,0.55)] border border-green-500/40",
    gallerySelected: "ring-2 ring-white ring-offset-1 ring-offset-black/80",
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
