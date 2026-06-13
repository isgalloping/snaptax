import type { Locale } from "@/lib/i18n";

export type LegalDoc = "privacy" | "terms";

export interface LegalSection {
  title: string;
  body: string[];
}

export interface LegalBundle {
  privacyTitle: string;
  termsTitle: string;
  lastUpdatedLabel: string;
  openFullPage: (title: string) => string;
  close: string;
  privacy: LegalSection[];
  terms: LegalSection[];
  dataStorageLabel: string;
}

export const LEGAL_CONTACT_EMAIL = "legal@snap1099.com";

const EN: LegalBundle = {
  privacyTitle: "Privacy Policy",
  termsTitle: "Terms of Service",
  lastUpdatedLabel: "Last Updated: June 2026 · GDPR & CPRA",
  openFullPage: (title) => `Open full ${title} page`,
  close: "Close",
  dataStorageLabel:
    "Processed and stored in the United States. See Privacy Policy for international transfers.",
  privacy: [
    {
      title: "Privacy by Design",
      body: [
        "We minimize data collection for receipt categorization and tax-season exports under GDPR and CPRA.",
        "Offline: receipts stay on your device until you are back online.",
        "Online (including before Google Sign-In): we send receipt images to our U.S. servers and OpenAI to categorize your receipt. We do not collect your name or email until you sign in with Google.",
      ],
    },
    {
      title: "Data Storage & International Transfers",
      body: [
        "Receipt images and related data are stored on encrypted cloud servers in the United States.",
        "By using the App and agreeing to our Terms and Privacy Policy, you acknowledge that your data will be processed in the U.S., which may have different laws than your country.",
        "We use TLS 1.3 and AES-256 at rest where supported; our providers comply with the EU-U.S. Data Privacy Framework where applicable.",
      ],
    },
    {
      title: "Google Sign-In",
      body: [
        "We request profile and email scopes only. We do not access Gmail, Drive, Photos, or Calendar.",
      ],
    },
    {
      title: "Sub-Processors",
      body: [
        "OpenAI (online receipt analysis, including before sign-in; no training on API data), Paddle, Google, Vercel/Neon/Blob (United States).",
      ],
    },
    {
      title: "No Sale of Data",
      body: [
        "Zero ads. We never sell or share your financial data with marketers or brokers.",
      ],
    },
    {
      title: "Your Rights",
      body: [
        "Access and export receipts in the App. Delete all data via Delete Account in Settings.",
        "Contact legal@snap1099.com — we aim to respond within 48 hours.",
      ],
    },
  ],
  terms: [
    {
      title: "Service",
      body: [
        "Snap1099 helps you photograph receipts, categorize expenses with AI, and export spreadsheets for tax prep. This is a tool, not tax or legal advice.",
      ],
    },
    {
      title: "Accounts",
      body: [
        "You may use the App with a Ghost ID before Google Sign-In. Online processing stores data in the United States as described in our Privacy Policy.",
        "If you change devices without signing in, local data cannot be recovered.",
      ],
    },
    {
      title: "Payments",
      body: ["Tax-season export uses Paddle one-time fees."],
    },
    {
      title: "Privacy",
      body: [
        "Use is governed by our Privacy Policy. By snapping a receipt while online, you agree to these Terms and the Privacy Policy, including U.S. processing.",
      ],
    },
    {
      title: "Disclaimer & Contact",
      body: [
        'The App is provided "as is" without warranties.',
        "Contact: legal@snap1099.com",
      ],
    },
  ],
};

const FR: LegalBundle = {
  privacyTitle: "Politique de confidentialité",
  termsTitle: "Conditions d'utilisation",
  lastUpdatedLabel: "Dernière mise à jour : juin 2026 · RGPD & CPRA",
  openFullPage: (title) => `Ouvrir la page complète — ${title}`,
  close: "Fermer",
  dataStorageLabel:
    "Traitement et stockage aux États-Unis. Voir la Politique de confidentialité pour les transferts internationaux.",
  privacy: [
    {
      title: "Confidentialité dès la conception",
      body: [
        "Nous limitons la collecte de données au strict nécessaire pour classer vos reçus et préparer les exports de saison fiscale, conformément au RGPD et au CPRA.",
        "Hors ligne : les reçus restent sur votre appareil jusqu'à ce que vous soyez de nouveau en ligne.",
        "En ligne (y compris avant la connexion Google) : nous envoyons les images de reçus à nos serveurs aux États-Unis et à OpenAI pour les analyser. Nous ne collectons ni votre nom ni votre e-mail tant que vous ne vous connectez pas avec Google.",
      ],
    },
    {
      title: "Stockage & transferts internationaux",
      body: [
        "Les images de reçus et les données associées sont stockées sur des serveurs cloud chiffrés aux États-Unis.",
        "En utilisant l'application et en acceptant nos Conditions et notre Politique de confidentialité, vous reconnaissez que vos données seront traitées aux États-Unis, où les lois peuvent différer de celles de votre pays.",
        "Nous utilisons TLS 1.3 et AES-256 au repos lorsque pris en charge ; nos prestataires respectent le EU-U.S. Data Privacy Framework le cas échéant.",
      ],
    },
    {
      title: "Connexion Google",
      body: [
        "Nous demandons uniquement les autorisations profil et e-mail. Nous n'accédons pas à Gmail, Drive, Photos ou Calendar.",
      ],
    },
    {
      title: "Sous-traitants",
      body: [
        "OpenAI (analyse en ligne des reçus, y compris avant connexion ; pas d'entraînement sur les données API), Paddle, Google, Vercel/Neon/Blob (États-Unis).",
      ],
    },
    {
      title: "Aucune vente de données",
      body: [
        "Zéro publicité. Nous ne vendons ni ne partageons vos données financières avec des annonceurs ou des courtiers.",
      ],
    },
    {
      title: "Vos droits",
      body: [
        "Accédez à vos reçus et exportez-les dans l'application. Supprimez toutes vos données via Supprimer le compte dans les Paramètres.",
        "Contact : legal@snap1099.com — réponse visée sous 48 heures.",
      ],
    },
  ],
  terms: [
    {
      title: "Service",
      body: [
        "Snap1099 vous aide à photographier des reçus, classer vos dépenses avec l'IA et exporter des tableurs pour la préparation fiscale. Il s'agit d'un outil, pas d'un conseil fiscal ou juridique.",
      ],
    },
    {
      title: "Comptes",
      body: [
        "Vous pouvez utiliser l'application avec un identifiant Ghost avant la connexion Google. Le traitement en ligne stocke les données aux États-Unis comme décrit dans notre Politique de confidentialité.",
        "Si vous changez d'appareil sans vous connecter, les données locales ne peuvent pas être récupérées.",
      ],
    },
    {
      title: "Paiements",
      body: [
        "L'export de saison fiscale est facturé via des paiements uniques Paddle.",
      ],
    },
    {
      title: "Confidentialité",
      body: [
        "L'utilisation est régie par notre Politique de confidentialité. En photographiant un reçu en ligne, vous acceptez ces Conditions et la Politique de confidentialité, y compris le traitement aux États-Unis.",
      ],
    },
    {
      title: "Clause de non-responsabilité & contact",
      body: [
        'L\'application est fournie « en l\'état » sans garantie.',
        "Contact : legal@snap1099.com",
      ],
    },
  ],
};

const DE: LegalBundle = {
  privacyTitle: "Datenschutzerklärung",
  termsTitle: "Nutzungsbedingungen",
  lastUpdatedLabel: "Zuletzt aktualisiert: Juni 2026 · DSGVO & CPRA",
  openFullPage: (title) => `Vollständige Seite öffnen — ${title}`,
  close: "Schließen",
  dataStorageLabel:
    "Verarbeitung und Speicherung in den Vereinigten Staaten. Internationale Übermittlungen siehe Datenschutzerklärung.",
  privacy: [
    {
      title: "Datenschutz by Design",
      body: [
        "Wir minimieren die Datenerhebung für Belegkategorisierung und Steuersaison-Exporte gemäß DSGVO und CPRA.",
        "Offline: Belege bleiben auf Ihrem Gerät, bis Sie wieder online sind.",
        "Online (auch vor Google-Anmeldung): Wir senden Belegbilder an unsere US-Server und OpenAI zur Kategorisierung. Name und E-Mail erheben wir erst nach Google-Anmeldung.",
      ],
    },
    {
      title: "Speicherung & internationale Übermittlungen",
      body: [
        "Belegbilder und zugehörige Daten werden auf verschlüsselten Cloud-Servern in den Vereinigten Staaten gespeichert.",
        "Mit Nutzung der App und Zustimmung zu diesen Bedingungen und der Datenschutzerklärung erkennen Sie an, dass Ihre Daten in den USA verarbeitet werden, wo andere Datenschutzgesetze gelten können.",
        "Wir nutzen TLS 1.3 und AES-256 at rest, soweit unterstützt; Anbieter halten das EU-U.S. Data Privacy Framework ein, wo anwendbar.",
      ],
    },
    {
      title: "Google-Anmeldung",
      body: [
        "Wir fordern nur Profil- und E-Mail-Berechtigungen an. Kein Zugriff auf Gmail, Drive, Fotos oder Kalender.",
      ],
    },
    {
      title: "Unterauftragsverarbeiter",
      body: [
        "OpenAI (Online-Beleganalyse, auch vor Anmeldung; kein Training mit API-Daten), Paddle, Google, Vercel/Neon/Blob (USA).",
      ],
    },
    {
      title: "Kein Verkauf von Daten",
      body: [
        "Keine Werbung. Wir verkaufen oder teilen Ihre Finanzdaten nicht mit Vermarktern oder Brokern.",
      ],
    },
    {
      title: "Ihre Rechte",
      body: [
        "Zugriff und Export von Belegen in der App. Löschung aller Daten über Konto löschen in den Einstellungen.",
        "Kontakt: legal@snap1099.com — Antwort innerhalb von 48 Stunden angestrebt.",
      ],
    },
  ],
  terms: [
    {
      title: "Leistung",
      body: [
        "Snap1099 hilft Ihnen, Belege zu fotografieren, Ausgaben per KI zu kategorisieren und Tabellen für die Steuervorbereitung zu exportieren. Es ist ein Werkzeug, keine Steuer- oder Rechtsberatung.",
      ],
    },
    {
      title: "Konten",
      body: [
        "Sie können die App mit einer Ghost-ID vor Google-Anmeldung nutzen. Online-Verarbeitung speichert Daten in den USA wie in der Datenschutzerklärung beschrieben.",
        "Ohne Anmeldung sind lokale Daten nach Gerätewechsel nicht wiederherstellbar.",
      ],
    },
    {
      title: "Zahlungen",
      body: ["Steuersaison-Export über einmalige Paddle-Gebühren."],
    },
    {
      title: "Datenschutz",
      body: [
        "Die Nutzung unterliegt unserer Datenschutzerklärung. Mit dem Fotografieren eines Belegs online stimmen Sie diesen Bedingungen und der Datenschutzerklärung einschließlich US-Verarbeitung zu.",
      ],
    },
    {
      title: "Haftungsausschluss & Kontakt",
      body: [
        'Die App wird „wie besehen" ohne Gewährleistung bereitgestellt.',
        "Kontakt: legal@snap1099.com",
      ],
    },
  ],
};

export const LEGAL_BY_LOCALE: Record<Locale, LegalBundle> = {
  "en-US": EN,
  "fr-FR": FR,
  "de-DE": DE,
};

export function getLegalBundle(locale: Locale): LegalBundle {
  return LEGAL_BY_LOCALE[locale] ?? LEGAL_BY_LOCALE["en-US"];
}

export function getLegalSections(
  doc: LegalDoc,
  locale: Locale,
): LegalSection[] {
  const bundle = getLegalBundle(locale);
  return doc === "privacy" ? bundle.privacy : bundle.terms;
}

export function getLegalTitle(doc: LegalDoc, locale: Locale): string {
  const bundle = getLegalBundle(locale);
  return doc === "privacy" ? bundle.privacyTitle : bundle.termsTitle;
}

export function formatDataStorageLabel(locale: Locale): string {
  return getLegalBundle(locale).dataStorageLabel;
}
