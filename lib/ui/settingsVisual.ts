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
    gridCols:
      "grid grid-cols-[1.35fr_0.55fr_1.35fr] divide-x divide-zinc-700 py-4",
    column: "flex min-w-0 flex-col items-center px-2 text-center",
    valuePositive: "text-green-500",
    valueNeutral: "text-zinc-200",
    label:
      "text-[10px] font-bold uppercase leading-tight text-balance text-zinc-400",
    value: "mt-1 text-2xl font-black sm:text-3xl",
    valueMoney:
      "mt-1 max-w-full text-[clamp(1.125rem,5.2vw,1.875rem)] font-black tabular-nums whitespace-nowrap",
    exportedStatus:
      "text-[11px] font-bold uppercase tracking-wider text-zinc-500",
  },
  exportCard: {
    container: "rounded-2xl border border-yellow-500/40 bg-zinc-900 p-4",
    subtitleCompat: "text-xs font-bold text-blue-400",
    subtitleFormat: "text-xs font-bold text-zinc-400",
    trustFootnote: "mt-3 text-xs font-bold text-zinc-400",
    badgePopular: "rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase text-white",
    price: "text-xl font-black text-yellow-500",
  },
  sectionHeading: "mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500",
  share: {
    panel: "border-t border-zinc-800 px-4 pb-3 pt-2",
    channelButton:
      "flex min-h-[3.875rem] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-transform active:scale-[0.98]",
    whatsapp: "border-[#1a5c2e] bg-[#0A1F10]",
    facebook: "border-[#1048a0] bg-[#0A1020]",
    more: "border-zinc-700 bg-zinc-900",
    channelTitle: "text-sm font-black text-white",
    channelSubtitle: "text-xs font-bold text-zinc-400",
  },
  shareTile: "rounded-xl bg-zinc-800 p-2 min-h-[4.5rem]",
  preferences: {
    container: "overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900",
    row: "flex min-h-[4.5rem] w-full items-center gap-3 px-4 py-3 text-left transition-transform active:scale-[0.99]",
    divider: "border-t border-zinc-800",
    notifPill: "rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-black text-white",
  },
} as const;
