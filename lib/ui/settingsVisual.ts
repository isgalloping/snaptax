export const settingsVisual = {
  pageBackgroundImage: "/photo/settings-bg.png",
  pageImage: "absolute inset-0 bg-cover bg-center bg-no-repeat",
  pageOverlayMain:
    "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.72) 45%, rgba(0,0,0,0.88) 100%)",
  pageOverlaySubpage:
    "linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.78) 45%, rgba(0,0,0,0.92) 100%)",
  taxOverview: {
    container:
      "rounded-2xl border border-yellow-500/30 bg-zinc-900 shadow-[0_0_24px_rgba(234,179,8,0.08)]",
    valuePositive: "text-green-500",
    valueNeutral: "text-zinc-200",
    label: "text-[10px] font-bold uppercase text-zinc-400",
    value: "mt-1 text-2xl font-black sm:text-3xl",
  },
  exportCard: {
    container: "rounded-2xl border border-yellow-500/40 bg-zinc-900 p-4",
    subtitleCompat: "text-xs font-bold text-blue-400",
    subtitleFormat: "text-xs font-bold text-zinc-400",
    trustFootnote: "mt-3 text-xs font-bold text-zinc-500",
    badgePopular: "rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase text-white",
    price: "text-xl font-black text-yellow-500",
  },
  referralCard: "rounded-2xl border border-zinc-800 bg-zinc-900 p-4",
  shareTile: "rounded-xl bg-zinc-800 p-2 min-h-[4.5rem]",
  preferences: {
    container: "overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900",
    row: "flex min-h-[4.5rem] w-full items-center gap-3 px-4 py-3 text-left transition-transform active:scale-[0.99]",
    divider: "border-t border-zinc-800",
    notifPill: "rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-black text-white",
  },
} as const;
