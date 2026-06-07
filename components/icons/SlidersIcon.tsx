export function SlidersIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <circle cx="4" cy="14" r="2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="20" cy="16" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
