export function TaxShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <path
        d="M24 4L8 10v12c0 9.2 6.4 17.8 16 20 9.6-2.2 16-10.8 16-20V10L24 4z"
        fill="currentColor"
        fillOpacity={0.15}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M24 14v14M18 21h12"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
