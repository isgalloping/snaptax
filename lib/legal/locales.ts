import type { Locale } from "@/lib/i18n";
import {
  LEGAL_BRAND_NAME,
  LEGAL_MAILING_ADDRESS,
  LEGAL_OPERATOR_NAME,
} from "./operator";

export type LocalizedLegalDoc = "privacy" | "terms";

export type LegalDoc = LocalizedLegalDoc | "data-retention" | "security";

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

export const LEGAL_CONTACT_EMAIL = "snaptax.lightxforge@gmail.com";

const EN: LegalBundle = {
  privacyTitle: "Privacy Policy",
  termsTitle: "Terms of Service",
  lastUpdatedLabel: "Last Updated: July 2026 · GDPR & CPRA",
  openFullPage: (title) => `Open full ${title} page`,
  close: "Close",
  dataStorageLabel:
    "Processed and stored in the United States. See Privacy Policy for international transfers.",
  privacy: [
    {
      title: "Operator & Contact",
      body: [
        `${LEGAL_BRAND_NAME} is operated by ${LEGAL_OPERATOR_NAME}, an individual sole proprietor.`,
        `Contact: ${LEGAL_CONTACT_EMAIL}. Mailing address: ${LEGAL_MAILING_ADDRESS}.`,
        "Customer data is processed and stored in the United States.",
      ],
    },
    {
      title: "Privacy by Design & Ownership",
      body: [
        "We minimize collection for receipt categorization and tax-season exports under GDPR and CPRA.",
        "You own your receipt data. We do not sell it or use it for ads.",
        "Offline: data stays on your device in encrypted storage. Online: U.S. processing as described in our full Privacy Policy.",
      ],
    },
    {
      title: "What We Collect",
      body: [
        "Receipt images, extracted metadata (merchant, amount, category), Google email/name if signed in, and payment metadata for export.",
        "We do not collect GPS, contacts, or cross-site browsing history.",
      ],
    },
    {
      title: "AI Processing",
      body: [
        "OpenAI analyzes receipt images when online. API data is not used to train models.",
        "Est. tax amounts are calculated on our servers — AI does not autonomously change filing status or ledger fields.",
      ],
    },
    {
      title: "Storage & International Transfers",
      body: [
        "Data is stored on encrypted servers in the United States.",
        "We use TLS 1.3, AES-256 at rest where supported, EU-U.S. Data Privacy Framework, and Standard Contractual Clauses (SCCs) where applicable.",
      ],
    },
    {
      title: "Retention & Security",
      body: [
        "See Data Retention and Security pages linked from Settings for retention periods and incident response.",
      ],
    },
    {
      title: "No Sale",
      body: [
        "We do not sell your personal information. Zero ads. No sharing with data brokers.",
      ],
    },
    {
      title: "Your Rights",
      body: [
        "Under GDPR and applicable US state privacy laws (including CPRA), you may have rights to access, rectification, erasure (Delete Account), portability (Export), restrict processing, and object — contact snaptax.lightxforge@gmail.com.",
        "We respond within 30 days (acknowledgment targeted within 48 hours).",
      ],
    },
  ],
  terms: [
    {
      title: "Service",
      body: [
        "SnapTax helps contractors, self-employed workers, and small businesses organize receipts, track expenses, and prepare export reports for tax season.",
        "This is a recordkeeping and export tool, not tax or legal advice. We do not file taxes or provide official government forms.",
      ],
    },
    {
      title: "Export Reports",
      body: [
        '"Tax-ready" means organized export files for your review — not IRS or software approval.',
        "You are responsible for verifying amounts and categories before filing.",
      ],
    },
    {
      title: "Accounts & Payments",
      body: [
        "Ghost use before Google Sign-In. Device loss without sign-in means data cannot be recovered.",
        "Tax-season export: one-time Paddle fee per season; unlimited re-export that season when paid.",
      ],
    },
    {
      title: "Disclaimer",
      body: [
        'Est. Tax Saved is an estimate only, not tax advice. App provided "as is". Liability capped to fees paid in the past 12 months.',
      ],
    },
    {
      title: "Privacy & Contact",
      body: [
        "Governed by our Privacy Policy. U.S. processing when snapping online.",
        "Contact: snaptax.lightxforge@gmail.com",
      ],
    },
  ],
};

const FR: LegalBundle = {
  privacyTitle: "Politique de confidentialité",
  termsTitle: "Conditions d'utilisation",
  lastUpdatedLabel: "Dernière mise à jour : juillet 2026 · RGPD & CPRA",
  openFullPage: (title) => `Ouvrir la page complète — ${title}`,
  close: "Fermer",
  dataStorageLabel:
    "Traitement et stockage aux États-Unis. Voir la Politique de confidentialité pour les transferts internationaux.",
  privacy: [
    {
      title: "Exploitant & contact",
      body: [
        `${LEGAL_BRAND_NAME} est exploité par ${LEGAL_OPERATOR_NAME}, entrepreneur individuel.`,
        `Contact : ${LEGAL_CONTACT_EMAIL}. Adresse postale : ${LEGAL_MAILING_ADDRESS}.`,
        "Les données clients sont traitées et stockées aux États-Unis.",
      ],
    },
    {
      title: "Confidentialité dès la conception & propriété",
      body: [
        "Nous limitons la collecte pour classer vos reçus et préparer les exports de saison fiscale, conformément au RGPD et au CPRA.",
        "Vous êtes propriétaire de vos données de reçus. Nous ne les vendons pas et ne les utilisons pas pour la publicité.",
        "Hors ligne : données sur votre appareil. En ligne : traitement aux États-Unis comme décrit dans notre Politique complète.",
      ],
    },
    {
      title: "Données collectées",
      body: [
        "Images de reçus, métadonnées extraites (commerçant, montant, catégorie), e-mail/nom Google si connecté, métadonnées de paiement pour l'export.",
        "Pas de GPS, contacts ni historique de navigation intersites.",
      ],
    },
    {
      title: "Traitement IA",
      body: [
        "OpenAI analyse les images de reçus en ligne. Les données API ne servent pas à l'entraînement.",
        "Les montants fiscaux estimés sont calculés sur nos serveurs — l'IA ne modifie pas autonomement le statut d'export.",
      ],
    },
    {
      title: "Stockage & transferts internationaux",
      body: [
        "Données stockées sur serveurs chiffrés aux États-Unis.",
        "TLS 1.3, AES-256 au repos, EU-U.S. Data Privacy Framework et Clauses contractuelles types (CCT) le cas échéant.",
      ],
    },
    {
      title: "Conservation & sécurité",
      body: [
        "Voir les pages Conservation des données et Sécurité dans les Paramètres pour les durées et la réponse aux incidents.",
      ],
    },
    {
      title: "Aucune vente",
      body: [
        "Nous ne vendons pas vos informations personnelles. Zéro publicité. Aucun partage avec des courtiers.",
      ],
    },
    {
      title: "Vos droits",
      body: [
        "En vertu du RGPD et des lois américaines sur la vie privée applicables (y compris le CPRA), vous pouvez disposer de droits d'accès, de rectification, d'effacement (Supprimer le compte), de portabilité (Export), de limitation et d'opposition — snaptax.lightxforge@gmail.com.",
        "Réponse sous 30 jours (accusé visé sous 48 heures).",
      ],
    },
  ],
  terms: [
    {
      title: "Service",
      body: [
        "SnapTax aide les contractuels, indépendants et petites entreprises à organiser leurs reçus, suivre leurs dépenses et préparer des exports pour la saison fiscale.",
        "Outil de tenue de registres et d'export, pas conseil fiscal. Nous ne déposons pas de déclarations ni ne fournissons de formulaires gouvernementaux officiels.",
      ],
    },
    {
      title: "Rapports d'export",
      body: [
        "« Prêt pour les impôts » = fichiers organisés pour votre examen — pas approbation IRS ou logiciel.",
        "Vous êtes responsable de vérifier montants et catégories avant dépôt.",
      ],
    },
    {
      title: "Comptes & paiements",
      body: [
        "Utilisation Ghost avant Google Sign-In. Perte d'appareil sans connexion = données non récupérables.",
        "Export de saison fiscale : frais unique Paddle par saison ; réexport illimité cette saison si payé.",
      ],
    },
    {
      title: "Clause de non-responsabilité",
      body: [
        "Est. Tax Saved est une estimation uniquement, pas un conseil fiscal. Application fournie « en l'état ». Responsabilité limitée aux frais des 12 derniers mois.",
      ],
    },
    {
      title: "Confidentialité & contact",
      body: [
        "Régi par notre Politique de confidentialité. Traitement aux États-Unis lors d'une photo en ligne.",
        "Contact : snaptax.lightxforge@gmail.com",
      ],
    },
  ],
};

const DE: LegalBundle = {
  privacyTitle: "Datenschutzerklärung",
  termsTitle: "Nutzungsbedingungen",
  lastUpdatedLabel: "Zuletzt aktualisiert: Juli 2026 · DSGVO & CPRA",
  openFullPage: (title) => `Vollständige Seite öffnen — ${title}`,
  close: "Schließen",
  dataStorageLabel:
    "Verarbeitung und Speicherung in den Vereinigten Staaten. Internationale Übermittlungen siehe Datenschutzerklärung.",
  privacy: [
    {
      title: "Betreiber & Kontakt",
      body: [
        `${LEGAL_BRAND_NAME} wird betrieben von ${LEGAL_OPERATOR_NAME}, einem Einzelunternehmer.`,
        `Kontakt: ${LEGAL_CONTACT_EMAIL}. Postanschrift: ${LEGAL_MAILING_ADDRESS}.`,
        "Kundendaten werden in den Vereinigten Staaten verarbeitet und gespeichert.",
      ],
    },
    {
      title: "Datenschutz by Design & Eigentum",
      body: [
        "Wir minimieren die Erhebung für Belegkategorisierung und Steuersaison-Exporte gemäß DSGVO und CPRA.",
        "Sie besitzen Ihre Belegdaten. Wir verkaufen sie nicht und nutzen sie nicht für Werbung.",
        "Offline: Daten auf Ihrem Gerät. Online: US-Verarbeitung wie in der vollständigen Datenschutzerklärung beschrieben.",
      ],
    },
    {
      title: "Erhobene Daten",
      body: [
        "Belegbilder, extrahierte Metadaten (Händler, Betrag, Kategorie), Google-E-Mail/Name bei Anmeldung, Zahlungsmetadaten für Export.",
        "Kein GPS, keine Kontakte, kein Cross-Site-Browsing-Verlauf.",
      ],
    },
    {
      title: "KI-Verarbeitung",
      body: [
        "OpenAI analysiert Belegbilder online. API-Daten werden nicht zum Training verwendet.",
        "Geschätzte Steuerbeträge werden auf unseren Servern berechnet — KI ändert Export-Status nicht autonom.",
      ],
    },
    {
      title: "Speicherung & internationale Übermittlungen",
      body: [
        "Daten auf verschlüsselten Servern in den Vereinigten Staaten.",
        "TLS 1.3, AES-256 at rest, EU-U.S. Data Privacy Framework und Standardvertragsklauseln (SCCs) wo anwendbar.",
      ],
    },
    {
      title: "Aufbewahrung & Sicherheit",
      body: [
        "Siehe Seiten Datenaufbewahrung und Sicherheit in den Einstellungen für Fristen und Vorfallreaktion.",
      ],
    },
    {
      title: "Kein Verkauf",
      body: [
        "Wir verkaufen Ihre personenbezogenen Daten nicht. Keine Werbung. Kein Teilen mit Brokern.",
      ],
    },
    {
      title: "Ihre Rechte",
      body: [
        "Nach DSGVO und anwendbarem US-Datenschutzrecht (einschließlich CPRA) können Ihnen Rechte auf Auskunft, Berichtigung, Löschung (Konto löschen), Übertragbarkeit (Export), Einschränkung und Widerspruch zustehen — snaptax.lightxforge@gmail.com.",
        "Antwort innerhalb von 30 Tagen (Bestätigung innerhalb von 48 Stunden angestrebt).",
      ],
    },
  ],
  terms: [
    {
      title: "Leistung",
      body: [
        "SnapTax hilft Auftragnehmern, Selbstständigen und kleinen Unternehmen, Belege zu organisieren, Ausgaben zu verfolgen und Exporte für die Steuersaison vorzubereiten.",
        "Werkzeug zur Aufzeichnung und zum Export, keine Steuerberatung. Wir reichen keine Steuererklärungen ein und stellen keine offiziellen Behördenformulare bereit.",
      ],
    },
    {
      title: "Exportberichte",
      body: [
        "„Steuerfertig“ bedeutet organisierte Exportdateien zur Prüfung — keine IRS- oder Software-Genehmigung.",
        "Sie sind für die Prüfung von Beträgen und Kategorien vor Abgabe verantwortlich.",
      ],
    },
    {
      title: "Konten & Zahlungen",
      body: [
        "Ghost-Nutzung vor Google-Anmeldung. Geräteverlust ohne Anmeldung = Daten nicht wiederherstellbar.",
        "Steuersaison-Export: einmalige Paddle-Gebühr pro Saison; unbegrenzter Re-Export in bezahlter Saison.",
      ],
    },
    {
      title: "Haftungsausschluss",
      body: [
        "Est. Tax Saved ist nur eine Schätzung, keine Steuerberatung. App \"wie besehen\". Haftung begrenzt auf Gebühren der letzten 12 Monate.",
      ],
    },
    {
      title: "Datenschutz & Kontakt",
      body: [
        "Unterliegt unserer Datenschutzerklärung. US-Verarbeitung beim Online-Fotografieren.",
        "Kontakt: snaptax.lightxforge@gmail.com",
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
  doc: LocalizedLegalDoc,
  locale: Locale,
): LegalSection[] {
  const bundle = getLegalBundle(locale);
  return doc === "privacy" ? bundle.privacy : bundle.terms;
}

export function getLegalTitle(doc: LocalizedLegalDoc, locale: Locale): string {
  const bundle = getLegalBundle(locale);
  return doc === "privacy" ? bundle.privacyTitle : bundle.termsTitle;
}

export function formatDataStorageLabel(locale: Locale): string {
  return getLegalBundle(locale).dataStorageLabel;
}
