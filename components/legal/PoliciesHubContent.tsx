import Link from "next/link";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal/content";

const POLICY_LINKS = [
  {
    href: "/terms",
    label: "Terms of Service",
    description: "App use, payments summary, liability",
  },
  {
    href: "/privacy",
    label: "Privacy Policy",
    description: "Data collection, US storage, GDPR rights",
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

export function PoliciesHubContent() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b-4 border-yellow-500 bg-zinc-900 p-6">
        <Link
          href="/"
          className="mb-4 inline-flex min-h-12 items-center text-sm font-black uppercase tracking-wider text-yellow-400"
        >
          &lt; Back to Snap1099
        </Link>
        <h1 className="text-2xl font-black uppercase tracking-wider">
          Terms &amp; Policies
        </h1>
        <p className="mt-2 text-xs text-zinc-400">Last Updated: July 2026</p>
      </header>
      <main className="mx-auto max-w-2xl p-6 pb-16">
        <p className="mb-6 text-sm leading-relaxed text-zinc-300">
          Legal documents for Snap1099 (SnapTax). Tap a policy to read the full
          text.
        </p>
        <ul className="space-y-3">
          {POLICY_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block min-h-16 rounded-xl border-2 border-zinc-600 bg-zinc-800 p-4 transition-transform active:scale-95"
              >
                <p className="text-sm font-bold text-white">{item.label}</p>
                <p className="mt-1 text-sm text-zinc-400">{item.description}</p>
              </Link>
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
      </main>
    </div>
  );
}
