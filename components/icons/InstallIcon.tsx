export function InstallIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M12 18h.01" />
      <path d="M12 8v4" />
      <path d="M10 10h4" />
    </svg>
  );
}
