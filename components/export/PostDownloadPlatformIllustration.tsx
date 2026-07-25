"use client";

import type { ExportPlatform } from "@/lib/export/detectExportPlatform";

interface PostDownloadPlatformIllustrationProps {
  platform: ExportPlatform;
}

export function PostDownloadPlatformIllustration({
  platform,
}: PostDownloadPlatformIllustrationProps) {
  if (platform === "android-chrome") {
    return (
      <svg
        viewBox="0 0 280 72"
        className="mx-auto h-16 w-full max-w-[280px]"
        aria-hidden
      >
        <rect x="8" y="12" width="264" height="48" rx="8" fill="#27272a" stroke="#52525b" strokeWidth="2" />
        <rect x="20" y="24" width="120" height="8" rx="2" fill="#52525b" />
        <rect x="228" y="20" width="32" height="32" rx="6" fill="#EAB308" />
        <text x="244" y="40" textAnchor="middle" fill="#000" fontSize="18" fontWeight="bold">
          ⋮
        </text>
        <path d="M 228 56 L 260 56" stroke="#EAB308" strokeWidth="2" markerEnd="url(#arrow)" />
        <rect x="188" y="58" width="72" height="10" rx="2" fill="#3f3f46" />
        <text x="224" y="66" textAnchor="middle" fill="#EAB308" fontSize="7" fontWeight="bold">
          Downloads
        </text>
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#EAB308" />
          </marker>
        </defs>
      </svg>
    );
  }

  if (platform === "ios-safari") {
    return (
      <svg
        viewBox="0 0 280 72"
        className="mx-auto h-16 w-full max-w-[280px]"
        aria-hidden
      >
        <rect x="8" y="8" width="264" height="56" rx="12" fill="#27272a" stroke="#52525b" strokeWidth="2" />
        <rect x="24" y="48" width="232" height="8" rx="4" fill="#3f3f46" />
        <circle cx="140" cy="52" r="10" fill="#EAB308" />
        <path
          d="M136 52 L144 52 M140 48 L140 56"
          stroke="#000"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text x="140" y="28" textAnchor="middle" fill="#a1a1aa" fontSize="8">
          Share → Files
        </text>
      </svg>
    );
  }

  if (platform === "desktop-chrome") {
    return (
      <svg
        viewBox="0 0 280 72"
        className="mx-auto h-16 w-full max-w-[280px]"
        aria-hidden
      >
        <rect x="8" y="12" width="264" height="40" rx="6" fill="#27272a" stroke="#52525b" strokeWidth="2" />
        <rect x="228" y="20" width="28" height="24" rx="4" fill="#EAB308" />
        <text x="242" y="36" textAnchor="middle" fill="#000" fontSize="14" fontWeight="bold">
          ↓
        </text>
        <rect x="40" y="58" width="200" height="10" rx="2" fill="#3f3f46" />
        <text x="140" y="66" textAnchor="middle" fill="#EAB308" fontSize="7" fontWeight="bold">
          Downloads bar
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 280 72"
      className="mx-auto h-16 w-full max-w-[280px]"
      aria-hidden
    >
      <rect x="100" y="16" width="80" height="56" rx="6" fill="#27272a" stroke="#52525b" strokeWidth="2" />
      <path
        d="M120 36 L140 52 L160 36"
        fill="none"
        stroke="#EAB308"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="128" y="24" width="24" height="16" rx="2" fill="#EAB308" opacity="0.3" />
    </svg>
  );
}
