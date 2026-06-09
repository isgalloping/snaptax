export function StackCardsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="8" width="14" height="12" rx="1.5" fill="currentColor" fillOpacity={0.15} />
      <rect x="5" y="5" width="14" height="12" rx="1.5" fill="currentColor" fillOpacity={0.25} />
      <rect x="7" y="2" width="14" height="12" rx="1.5" fill="currentColor" fillOpacity={0.35} />
      <path d="M10 6h8M10 9h6" strokeWidth={1.5} />
    </svg>
  );
}
