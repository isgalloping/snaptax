export type LegalDoc = "privacy" | "terms";

export interface LegalSection {
  title: string;
  body: string[];
}

export const PRIVACY_SECTIONS: LegalSection[] = [
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
];

export const TERMS_SECTIONS: LegalSection[] = [
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
    body: [
      "Tax-season export uses Paddle one-time fees.",
    ],
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
];

export const COMPLIANCE_FOOTNOTE =
  "By snapping, you agree to our Terms & Privacy Policy. Online processing stores data in the United States.";

export const DATA_STORAGE_LABEL_US =
  "Processed and stored in the United States. See Privacy Policy for international transfers.";

export function getLegalSections(doc: LegalDoc): LegalSection[] {
  return doc === "privacy" ? PRIVACY_SECTIONS : TERMS_SECTIONS;
}

export function getLegalTitle(doc: LegalDoc): string {
  return doc === "privacy" ? "Privacy Policy" : "Terms of Service";
}

export const LEGAL_CONTACT_EMAIL = "legal@snap1099.com";

/** MVP: single U.S. region; informed consent via Privacy §4 */
export function formatDataStorageLabel(): string {
  return DATA_STORAGE_LABEL_US;
}
