"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingAppLink } from "@/components/marketing/MarketingAppLink";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-black tracking-tight text-white"
        >
          {MARKETING_COPY.brand}
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-zinc-300 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/10 text-lg text-white md:hidden"
            aria-expanded={menuOpen}
            aria-controls="marketing-mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "×" : "☰"}
          </button>
          <MarketingAppLink
            className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-bold text-zinc-200 transition-colors hover:text-white sm:flex"
          >
            Sign In
          </MarketingAppLink>
          <MarketingAppLink
            className="hidden min-h-11 items-center rounded-lg px-4 text-sm font-black text-black transition-transform active:scale-95 md:flex"
            style={{ backgroundColor: MARKETING_TOKENS.ctaYellow }}
          >
            {MARKETING_COPY.hero.primaryCta}
          </MarketingAppLink>
        </div>
      </div>
      {menuOpen ? (
        <nav
          id="marketing-mobile-nav"
          className="border-t border-white/10 px-4 py-4 md:hidden"
          aria-label="Main"
        >
          <ul className="space-y-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-12 items-center rounded-lg px-3 text-sm font-semibold text-zinc-200 hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <MarketingAppLink
                className="flex min-h-12 items-center justify-center rounded-lg px-3 text-sm font-black text-black transition-transform active:scale-95"
                style={{ backgroundColor: MARKETING_TOKENS.ctaYellow }}
                onClick={() => setMenuOpen(false)}
              >
                {MARKETING_COPY.hero.primaryCta}
              </MarketingAppLink>
            </li>
            <li>
              <MarketingAppLink
                className="flex min-h-12 items-center rounded-lg px-3 text-sm font-semibold text-zinc-200 hover:bg-white/5"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </MarketingAppLink>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
