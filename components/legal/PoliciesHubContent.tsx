"use client";

import Link from "next/link";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal/content";
import { LegalFullPageShell } from "@/components/legal/LegalFullPageShell";

const COMMERCE_POLICY_LINKS = [
  {
    href: "/terms",
    label: "Terms of Service",
    description: "App use, payments, liability",
  },
  {
    href: "/pricing",
    label: "Pricing",
    description: "Export Tax Pack season pricing",
  },
  {
    href: "/refund",
    label: "Refund Policy",
    description: "Refunds via Paddle",
  },
] as const;

const OTHER_POLICY_LINKS = [
  {
    href: "/privacy",
    label: "Privacy Policy",
    description: "Data collection, US storage, GDPR rights",
  },
  {
    href: "/data-retention",
    label: "Data Retention",
    description: "How long we keep data",
  },
  {
    href: "/security",
    label: "Security & Incidents",
    description: "Security contact and incident response",
  },
] as const;

function PolicyCard({
  href,
  label,
  description,
  compact,
}: {
  href: string;
  label: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block min-h-16 rounded-xl border-2 border-zinc-600 bg-zinc-800 p-4 transition-transform active:scale-95"
    >
      <p className="text-sm font-bold text-white">{label}</p>
      {!compact && (
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      )}
    </Link>
  );
}

export function PoliciesHubContent() {
  return (
    <LegalFullPageShell
      title="Terms & Policies"
      subtitle="Last Updated: July 2026"
    >
      <p className="mb-6 text-sm leading-relaxed text-zinc-300">
        Legal documents for Snap1099 (SnapTax). Tap a policy to read the full
        text.
      </p>

      <ul className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {COMMERCE_POLICY_LINKS.map((item) => (
          <li key={item.href}>
            <PolicyCard {...item} compact />
          </li>
        ))}
      </ul>

      <ul className="space-y-3">
        {OTHER_POLICY_LINKS.map((item) => (
          <li key={item.href}>
            <PolicyCard {...item} />
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-zinc-400">
        Contact:{" "}
        <a
          href={`mailto:${LEGAL_CONTACT_EMAIL}`}
          className="font-bold text-yellow-400 underline"
        >
          {LEGAL_CONTACT_EMAIL}
        </a>
      </p>
    </LegalFullPageShell>
  );
}
