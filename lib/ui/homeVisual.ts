export const homeVisual = {
  heroCard: {
    shell: "relative mx-4 mt-2 shrink-0 overflow-hidden rounded-2xl border border-zinc-800",
    image: "bg-cover bg-[85%_center] bg-no-repeat",
  },
  heroImage: "/photo/hero.png",
  heroOverlay:
    "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 42%, rgba(0,0,0,0.05) 72%, transparent 100%), linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 55%, #000 100%)",
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
    doneMuted: "text-zinc-500",
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
    /** +20% vs size — detail sheet DELETE only; bumped +20% again (2026-06-19) */
    deleteSize: "h-[5.04rem] w-[5.04rem]",
    delete:
      "rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.45)] border border-red-500/60",
    resnap:
      "rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.45)] border border-red-500/60",
    accept:
      "rounded-full bg-green-600 shadow-[0_0_16px_rgba(34,197,94,0.45)] border border-green-500/60",
  },
  /** +15% over baseline px-3 py-1.5 text-xs gap-2 — outdoor touch target */
  filterTab: {
    padding: "px-[0.8625rem] py-[0.43125rem]",
    fontSize: "text-[0.8625rem]",
    gap: "gap-[0.575rem]",
    iconGap: "mr-[0.2875rem]",
    countGap: "ml-[0.2875rem]",
  },
  /** @deprecated use widgetPager — per-card horizontal carousel */
  widgetCarousel: {
    slide:
      "snap-start shrink-0 w-[38vw] min-w-[132px] max-w-[160px] h-[104px] rounded-2xl border p-3",
    track:
      "flex touch-pan-x gap-2.5 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory px-4 pt-3 pb-1",
  },
  widgetPager: {
    container: "shrink-0 px-4 pb-2 pt-1",
    viewport: "overflow-x-hidden",
    viewportPaginated:
      "flex touch-pan-x overflow-x-auto overscroll-x-contain snap-x snap-mandatory",
    page: "flex w-full shrink-0 snap-start gap-2",
    cardBase: "h-[104px] w-full rounded-2xl border p-3",
    dots: "mt-2 flex items-center justify-center gap-1.5",
    dot: "h-1.5 w-1.5 rounded-full bg-zinc-600",
    dotActive: "bg-yellow-500",
  },
  trustBar: {
    /** Hairline under hero fade — no boxed card */
    divider: "rgba(39, 39, 42, 0.4)",
    /** Soft continuation from hero black fade into snap zone */
    heroFade:
      "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,1) 55%)",
  },
  headerActionBtn:
    "flex min-h-16 min-w-[3.5rem] flex-col items-center justify-center rounded-xl border border-zinc-700 bg-black/40 px-2 transition-transform active:scale-95 disabled:opacity-40",
  widgets: {
    deadline: {
      bg: "bg-violet-950/80",
      border: "border-violet-700/60",
      accent: "text-violet-300",
    },
    missing: {
      bg: "bg-green-950/80",
      border: "border-green-700/60",
      accent: "text-green-300",
    },
    progress: {
      bg: "bg-blue-950/80",
      border: "border-blue-700/60",
      accent: "text-blue-300",
    },
    cpa: {
      bg: "bg-orange-950/80",
      border: "border-orange-700/60",
      accent: "text-orange-300",
    },
    needAction: {
      bg: "bg-red-950/80",
      border: "border-red-700/60",
      accent: "text-red-300",
    },
  },
} as const;

export type ReceiptVisualState =
  | "uploading"
  | "analyzing"
  | "paused"
  | "done"
  | "blurry";
