# SnapTax Privacy Policy

**Last Updated:** July 2026  
**Applicable Jurisdictions:** United States (including California CPRA) & European Union (GDPR)

Welcome to SnapTax. SnapTax and Snap1099 refer to the same application ("the App"). This Privacy Policy explains how we collect, use, process, and safeguard your data when you use the App.

We help contractors, self-employed workers, and small businesses organize receipts and prepare tax-season exports. We do not sell your data or use it for advertising.

## 1. Privacy by Design & Data Ownership

We minimize data collection to what is needed to categorize business receipts and prepare tax-season exports. We follow **GDPR Article 13** and the **California Privacy Rights Act (CPRA)**.

**You own your business receipt data.** We act as a processor to help you organize and export it. We do not sell your data or use it for advertising.

### Ghost / Anonymous Use (Before Google Sign-In)

When you first use the App, we assign a random **Ghost ID** on your device.

- **Offline:** Receipt photos and extracted data are kept **on your device** in encrypted browser storage until you are back online.
- **After upload:** Receipt images are stored on our **United States** servers (see §6); local full-resolution copies may be removed per our [Data Retention Policy](/data-retention).
- **Online:** When you have a network connection, we send receipt images to our **United States** servers and to **OpenAI** (via our API) so we can read and categorize your receipt. Results are shown in the App and associated with your Ghost ID.
- We do **not** collect your name or email until you choose **Google Sign-In**.

### After Google Sign-In

When you sign in with Google, we link your Ghost ID to your account so your receipts and settings can sync across devices. Your data remains on the same **United States** infrastructure described below.

## 2. What We Collect

| Category | Examples | Purpose |
|----------|----------|---------|
| Receipt images | Photos you snap | OCR / AI categorization, export |
| Receipt metadata | Merchant, date, amount, category, tax fields | Display, tax estimates, export |
| Account data | Google email, display name (if signed in) | Identity, sync, support |
| Payment metadata | Paddle transaction references | Tax-season export entitlement |
| Technical logs | Request IDs, error codes (no receipt images) | Security, reliability |

### Data We Do Not Collect

- Precise GPS location.
- Contacts, other apps, or cross-site browsing history.

## 3. Google Sign-In

We use Google Sign-In only for identity, security, and multi-device sync.

- **Scopes:** `profile` and `email` only.
- We do **not** access Gmail, Drive, Photos, or Calendar.
- We never see or store your Google password.

## 4. AI Processing

When you are **online**, receipt images (and optional on-device OCR text) are sent to **OpenAI** through our servers for analysis.

- **No model training:** OpenAI API data is **not** used to train their models (per OpenAI API terms).
- **Minimum necessary:** We send only what is required to extract merchant, amounts, categories, and similar fields.
- **Tax amounts:** Estimated tax savings (`tax_amount`) are calculated on our servers using documented formulas — **AI does not autonomously modify financial ledger fields or export filing status.**

## 5. Sub-Processors

| Provider | Purpose |
|----------|---------|
| **OpenAI** | Receipt image analysis when **online** (including before sign-in); API data not used to train models |
| **Paddle** | Payment processing for tax-season export |
| **Google** | OAuth authentication |
| **Vercel / Neon / Blob** | Hosting, database, and image storage (**United States**) |

All transfers use **TLS 1.3**. Sub-processors are bound by contractual data protection terms.

## 6. Data Storage & International Transfers

To provide our Services, your receipt images and related data are securely transferred to and stored on **encrypted cloud servers located in the United States**.

By using the App and agreeing to our Terms and Privacy Policy (including when you snap a receipt while online), you **expressly acknowledge** that your data will be processed in the United States, which may have different data protection laws than your country of residence.

We safeguard international data transfers using industry-standard encryption (**TLS 1.3** and **AES-256** at rest where supported by our cloud providers) and rely on appropriate transfer mechanisms, including:

- Compliance by our infrastructure partners with the **EU-U.S. Data Privacy Framework** where applicable, and
- **Standard Contractual Clauses (SCCs)** where the Framework does not apply.

## 7. Data Retention

We retain data only as long as needed for the purposes described in this Policy. See our [Data Retention Policy](/data-retention) for retention periods by data type and your deletion options.

## 8. No Sale of Personal Information (CPRA)

**We do not sell your personal information.**

- **Zero ads.**
- We **never sell or share** your financial or receipt data with marketers, insurers, or data brokers for cross-context behavioral advertising.
- Revenue comes only from your voluntary tax-season export purchase.

### California Notice at Collection (last 12 months)

| Category | Collected | Disclosed to service providers | Sold |
|----------|-----------|------------------------------|------|
| Identifiers (Ghost ID, email if signed in) | Yes | Yes (hosting, auth) | **No** |
| Financial / receipt data | Yes | Yes (AI, storage) | **No** |
| Commercial information (export purchase) | Yes | Yes (Paddle) | **No** |
| Internet / device activity (security logs) | Yes | Yes (hosting) | **No** |

## 9. Your Rights (GDPR & CPRA)

Depending on your location, you may have the right to:

- **Access** — view receipts in the App or export via Tax Pack.
- **Rectification** — correct receipt details in the App where supported, or contact us.
- **Erasure** — **Delete Account** in Settings (irreversible; removes server and local data tied to your session or account).
- **Data portability** — export structured data via Tax Pack export.
- **Restrict processing** — contact us to limit certain processing where applicable.
- **Object** — stop using the App or delete your account.

We will respond to verified requests at **legal@snap1099.com** within **30 days** (we aim to acknowledge within 48 hours). We may extend by 60 days where permitted by law, with notice.

## 10. Security

We use encryption, access controls, and monitoring appropriate to financial receipt data. See our [Security & Incident Response](/security) summary.

## 11. Children

The App is not directed to children under 13. We do not knowingly collect personal information from children.

## 12. Changes & Contact

We may update this Policy. Material changes will be reflected in the "Last Updated" date. Continued use after changes constitutes acceptance where permitted by law.

**Contact:** **legal@snap1099.com**
