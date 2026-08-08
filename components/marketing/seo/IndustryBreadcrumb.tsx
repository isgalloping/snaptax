import Link from "next/link";

export function IndustryBreadcrumb({
  industryLabel,
  industryHref,
}: {
  industryLabel: string;
  industryHref: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-zinc-400">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="hover:text-white">
            Home
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link href="/tax-deductions" className="hover:text-white">
            Tax Deductions
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link
            href={industryHref}
            className="text-white hover:text-white"
            aria-current="page"
          >
            {industryLabel}
          </Link>
        </li>
      </ol>
    </nav>
  );
}
