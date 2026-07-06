import Link from "next/link";
import { MarketingAppLink } from "@/components/marketing/MarketingAppLink";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

export const metadata = buildMarketingMetadata({
  title: "Cookie Policy — SnapTax",
  description: "How SnapTax uses cookies and similar technologies.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black text-white">Cookie Policy</h1>
      <p className="mt-6 text-sm leading-relaxed text-zinc-400">
        SnapTax uses essential cookies for authentication, session management,
        and PWA installation. These cookies are required for the product to
        function when you use the app at{" "}
        <MarketingAppLink className="text-white underline-offset-4 hover:underline">
          /app
        </MarketingAppLink>
        .
      </p>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">
        We may use analytics cookies only with your consent where required by
        law (for example, in the EU). You can control non-essential cookies
        through your browser settings.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">
        For details on how we process personal data, see our{" "}
        <Link
          href="/privacy"
          className="text-white underline-offset-4 hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
