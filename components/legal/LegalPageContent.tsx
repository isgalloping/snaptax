import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { LegalDoc } from "@/lib/legal/content";

interface LegalSection {
  titleKey: string;
  bodyKeys: string[];
}

const PRIVACY_SECTIONS: LegalSection[] = [
  { titleKey: "privacyByDesignTitle", bodyKeys: ["privacyByDesignBody1", "privacyByDesignBody2", "privacyByDesignBody3"] },
  { titleKey: "dataStorageTitle", bodyKeys: ["dataStorageBody1", "dataStorageBody2", "dataStorageBody3"] },
  { titleKey: "googleSignInTitle", bodyKeys: ["googleSignInBody"] },
  { titleKey: "subProcessorsTitle", bodyKeys: ["subProcessorsBody"] },
  { titleKey: "noSaleTitle", bodyKeys: ["noSaleBody"] },
  { titleKey: "yourRightsTitle", bodyKeys: ["yourRightsBody1", "yourRightsBody2"] },
];

const TERMS_SECTIONS: LegalSection[] = [
  { titleKey: "termsServiceTitle", bodyKeys: ["termsServiceBody"] },
  { titleKey: "termsAccountsTitle", bodyKeys: ["termsAccountsBody1", "termsAccountsBody2"] },
  { titleKey: "termsPaymentsTitle", bodyKeys: ["termsPaymentsBody"] },
  { titleKey: "termsPrivacyTitle", bodyKeys: ["termsPrivacyBody"] },
  { titleKey: "termsDisclaimerTitle", bodyKeys: ["termsDisclaimerBody1", "termsDisclaimerBody2"] },
];

export async function LegalPageContent({ doc }: { doc: LegalDoc }) {
  const t = await getTranslations("Legal");
  const sections = doc === "privacy" ? PRIVACY_SECTIONS : TERMS_SECTIONS;
  const title = doc === "privacy" ? t("privacyPolicy") : t("termsOfService");

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b-4 border-yellow-500 bg-zinc-900 p-6">
        <Link
          href="/"
          className="mb-4 inline-flex min-h-12 items-center text-sm font-black uppercase tracking-wider text-yellow-400"
        >
          &lt; Back to Snap1099
        </Link>
        <h1 className="text-2xl font-black uppercase tracking-wider">{title}</h1>
        <p className="mt-2 text-xs text-zinc-400">
          {t("lastUpdated")}
        </p>
      </header>
      <main className="mx-auto max-w-2xl p-6 pb-16">
        {sections.map((section) => (
          <section key={section.titleKey} className="mb-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-yellow-400">
              {t(section.titleKey)}
            </h2>
            {section.bodyKeys.map((bodyKey) => (
              <p
                key={bodyKey}
                className="mb-3 text-sm leading-relaxed text-zinc-300"
              >
                {t(bodyKey)}
              </p>
            ))}
          </section>
        ))}
        <p className="text-sm text-zinc-400">
          Full text:{" "}
          <code className="text-yellow-400">
            docs/legal/{doc === "privacy" ? "privacy" : "terms"}.md
          </code>
        </p>
      </main>
    </div>
  );
}
