import Link from "next/link";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

function SnapTaxLogoMark() {
  return (
    <span
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: MARKETING_TOKENS.accentGreen }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-black" fill="currentColor">
        <path d="M9 4a2 2 0 0 0-2 2v1H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3h-1V6a2 2 0 0 0-2-2H9zm0 2h6v1H9V6zm-3 4h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z" />
        <circle cx="12" cy="13" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </span>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M13.5 8.5V7c0-.8.2-1.3 1.7-1.3H17V3h-2.4C11.8 3 10.5 4.4 10.5 6.7V8.5H8v2.8h2.5V21h3V11.3H16l.4-2.8h-2.9z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="m16.2 4 3.8 5.2L21 4h2.3l-4.8 6.3L24 20h-4.6l-3.3-4.5L12.8 20H8.5l4.9-6.7L4 4h4.7l3 4.1L16.2 4zm-1.4 14h1.3L8.8 6H7.4l7.4 12z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm5 3.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5zM17.8 7.2a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  facebook: FacebookIcon,
  x: XIcon,
  instagram: InstagramIcon,
  email: EmailIcon,
} as const;

export function MarketingFooter() {
  const { brand, footer } = MARKETING_COPY;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-3">
            <SnapTaxLogoMark />
            <span className="text-lg font-black text-white">{brand}</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-400">
            {footer.tagline}
          </p>
          <ul className="mt-5 flex items-center gap-3">
            {footer.social.map((item) => {
              const Icon = SOCIAL_ICONS[item.id];
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:text-white"
                    aria-label={item.label}
                  >
                    <Icon />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        {footer.columns.map((column) => (
          <div key={column.title}>
            <h2 className="text-sm font-bold text-white">{column.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={`${column.title}-${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-6 text-center text-xs text-zinc-500 sm:px-6">
        © {year} {footer.copyrightHolder}. All rights reserved.
      </div>
    </footer>
  );
}
