# i18n Internationalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-language support (en/fr/de) to Snap1099 using next-intl with cookie-based locale detection.

**Architecture:** Cookie-based locale (no URL prefix). `next-intl` reads `NEXT_LOCALE` cookie on each request via `i18n/request.ts`, loads the correct `messages/{locale}.json`, provides translations to components via `useTranslations()` (client) / `getTranslations()` (server). A `<LocaleInitializer>` client component auto-detects browser language and writes the cookie on first visit.

**Tech Stack:** next-intl v4.12+, Next.js 16, React 19, TypeScript, Tailwind 4

**Design spec:** `docs/superpowers/specs/2026-06-11-i18n-internationalization-design.md`

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `i18n/config.ts` | Locale list, default locale, `Locale` type |
| `i18n/request.ts` | `getRequestConfig` — reads cookie, loads messages |
| `messages/en.json` | English translations (source of truth) |
| `messages/fr.json` | French translations |
| `messages/de.json` | German translations |
| `lib/client/locale.ts` | Browser locale detection + cookie write |
| `components/i18n/LocaleInitializer.tsx` | Client component — calls `ensureLocaleCookie()` on mount |

### Modified files

| File | Change |
|------|--------|
| `next.config.ts` | Wrap with `createNextIntlPlugin()` |
| `app/layout.tsx` | Add `NextIntlClientProvider`, dynamic `lang`, `<LocaleInitializer>` |
| `components/home/TaxHeader.tsx` | Replace hardcoded strings → `useTranslations('Home')` |
| `components/home/SnapButton.tsx` | Replace hardcoded strings → `useTranslations('Home')` |
| `components/home/StatusPill.tsx` | Replace LABEL map → `useTranslations('ReceiptStatus')` |
| `components/home/ReceiptList.tsx` | Replace hardcoded strings → `useTranslations('Home')` |
| `components/home/ReceiptListCard.tsx` | Replace hardcoded strings → `useTranslations('ReceiptCard')` |
| `components/home/ReceiptFilterBar.tsx` | Replace hardcoded strings → `useTranslations('ReceiptFilter')` |
| `components/home/HomeScreen.tsx` | Replace `"Scanning"` → `useTranslations('Home')` |
| `components/camera/CameraOverlay.tsx` | Replace `USER_COPY` → `useTranslations('Camera')` |
| `components/camera/CameraLiveFooter.tsx` | Replace strings → `useTranslations('Camera')` |
| `components/camera/CameraShutterControl.tsx` | Replace strings → `useTranslations('Camera')` |
| `components/camera/ReceiptReviewControls.tsx` | Replace strings → `useTranslations('Common')` |
| `components/camera/FlashDoneButton.tsx` | Replace strings → `useTranslations('Camera')` |
| `components/camera/ReviewDoneButton.tsx` | Replace strings → `useTranslations('Camera')` |
| `components/camera/BatchCountBadge.tsx` | Replace strings → `useTranslations('Camera')` |
| `components/settings/SettingsScreen.tsx` | Replace strings → `useTranslations('Settings')` |
| `components/settings/PrivacyDataSection.tsx` | Replace strings → `useTranslations('Privacy')` |
| `components/settings/PaywallSheet.tsx` | Replace strings → `useTranslations('Paywall')` |
| `components/auth/GoogleSignInSheet.tsx` | Replace COPY → `useTranslations('Auth')` |
| `components/auth/SyncInstructionsSheet.tsx` | Replace strings → `useTranslations('Auth')` |
| `components/auth/AccountStatusBlock.tsx` | Replace strings → `useTranslations('Auth')` |
| `components/legal/ComplianceFootnote.tsx` | Replace strings → `useTranslations('Legal')` |
| `components/legal/LegalSheet.tsx` | Replace strings → `useTranslations('Legal')` |
| `components/pwa/InstallPrompt.tsx` | Replace `USER_COPY.pwa` → `useTranslations('Pwa')` |
| `components/pwa/InstallManualSheet.tsx` | Replace `USER_COPY.pwa` → `useTranslations('Pwa')` |
| `app/offline/page.tsx` | Replace `USER_COPY.offline` → `getTranslations('Offline')` |
| `components/landing/*` (5 files) | Replace `dataStreamCopy` → `useTranslations('Landing')` / `getTranslations('Landing')` |
| `components/receipts/ReceiptDetailSheet.tsx` | Replace strings → `useTranslations('ReceiptDetail')` |
| `lib/format.ts` | Add optional `translations` param for Today/Yesterday |
| `lib/types.ts` | Change `INDUSTRIES` label to i18n key |

### Files to delete (Task 6)

| File | Reason |
|------|--------|
| `lib/copy/userFacing.ts` | Replaced by `messages/*.json` |
| `components/landing/dataStreamCopy.ts` | Replaced by `messages/*.json` Landing namespace |

---

## Task 1: Install next-intl and Create Infrastructure

**Files:**
- Modify: `package.json` (add `next-intl`)
- Create: `i18n/config.ts`
- Create: `i18n/request.ts`
- Modify: `next.config.ts`
- Create: `messages/en.json`
- Create: `messages/fr.json`
- Create: `messages/de.json`
- Create: `lib/client/locale.ts`
- Create: `components/i18n/LocaleInitializer.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Install next-intl**

```bash
npm install next-intl
```

- [ ] **Step 2: Create `i18n/config.ts`**

```ts
export const locales = ["en", "fr", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
```

- [ ] **Step 3: Create `i18n/request.ts`**

```ts
import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { locales, defaultLocale } from "./config";

export default getRequestConfig(async () => {
  const store = await cookies();
  const requested = store.get("NEXT_LOCALE")?.value;
  const locale = hasLocale(locales, requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 4: Create `messages/en.json`**

Create the English message file with all namespaces. This is the source of truth — all keys defined here must exist in fr.json and de.json.

```json
{
  "Common": {
    "back": "Back",
    "cancel": "Cancel",
    "done": "Done",
    "delete": "Delete",
    "retry": "Retry",
    "loading": "Loading…",
    "offline": "Offline",
    "online": "Online",
    "close": "Close",
    "notNow": "Not now",
    "gotIt": "Got it"
  },
  "Home": {
    "estimatedTaxSaved": "Estimated Tax Saved",
    "receiptsTracked": "{count, plural, one {# receipt} other {# receipts}} tracked",
    "snapReceipt": "Snap Receipt",
    "takePhoto": "Take a photo of your receipt",
    "resnapReceipt": "Resnap this receipt",
    "allLocalReceipts": "All Local Receipts",
    "pullToRefresh": "Pull to refresh",
    "scanning": "Scanning",
    "snapFirstReceipt": "Snap your first receipt to get started",
    "noReceiptsInFilter": "No receipts in this filter",
    "installApp": "Install app",
    "syncReceipts": "Sync receipts",
    "settings": "Settings",
    "nullTax": "$- - -"
  },
  "ReceiptCard": {
    "uploadPaused": "Upload Paused",
    "analysisPaused": "Analysis Paused",
    "uploading": "Uploading...",
    "tapToRetry": "Tap to retry",
    "processing": "Processing",
    "receiptBlurry": "Receipt Blurry",
    "needAction": "Need Action",
    "resnap": "Resnap",
    "unknownMerchant": "Unknown merchant",
    "other": "Other"
  },
  "ReceiptFilter": {
    "all": "All",
    "ready": "Ready",
    "processing": "Processing",
    "blurry": "Blurry",
    "stuckReceipts": "Stuck receipts"
  },
  "ReceiptStatus": {
    "analyzing": "Analyzing",
    "uploading": "Uploading",
    "paused": "Paused"
  },
  "ReceiptDetail": {
    "calculatingDeductions": "Calculating your deductions...",
    "taxAiCouldntRead": "Tax AI Couldn't Read This",
    "merchant": "Merchant",
    "irsLine": "IRS Line",
    "addedToScheduleC": "✓ Added to Schedule C Deduction",
    "personalNonDeductible": "Personal (Non-Deductible)",
    "unknownUnclear": "Unknown (Unclear)",
    "resetZoom": "Reset zoom (1:1)",
    "receiptPreview": "Receipt preview",
    "date": "Date",
    "amount": "Amount",
    "category": "Category",
    "deductible": "Deductible",
    "taxSaved": "Tax Saved",
    "yes": "Yes",
    "no": "No",
    "securityNote": "Receipt data encrypted in transit and at rest.",
    "blurryTitle": "Blurry Receipt",
    "blurryBody": "The AI couldn't read this receipt clearly. Please resnap it.",
    "resnap": "Resnap",
    "deleteReceipt": "Delete Receipt"
  },
  "Camera": {
    "opening": "Opening camera…",
    "openFailed": "Couldn't open camera. Try again.",
    "captureFailed": "Capture failed. Try again.",
    "retry": "Retry",
    "chooseGallery": "Choose from gallery",
    "takePhoto": "Take Photo",
    "flashDone": "Flash Done",
    "doneReview": "Done & Review",
    "batchCount": "Batch {count}",
    "back": "< Back",
    "errorNotAllowed": "Camera access is required to snap receipts. Allow camera in your browser settings.",
    "errorNotFound": "No camera found",
    "errorNotReadable": "Camera is in use by another app",
    "errorDefault": "Couldn't open camera. Try again.",
    "latestPhoto": "Latest receipt photo"
  },
  "Settings": {
    "title": "Settings",
    "back": "< Back",
    "yourIndustry": "Your Industry",
    "multiDevice": "Multi-Device",
    "viewOnAllDevices": "View on All Devices",
    "taxSeasonExport": "Tax Season Export",
    "exportTaxPack": "Export IRS Tax Pack",
    "exportAgain": "Export Again",
    "exportFailed": "Export failed. Please try again.",
    "exportFailedAfterPayment": "Export failed after payment. Try Export Again.",
    "shareTitle": "Snap1099 Tax Pack {season}",
    "shareText": "Your IRS-ready expense export"
  },
  "Privacy": {
    "title": "Privacy & Data",
    "privacyPolicy": "Privacy Policy",
    "termsOfService": "Terms of Service",
    "dataStorage": "Data storage",
    "dataStorageLabel": "Processed and stored in the United States. See Privacy Policy for international transfers.",
    "contact": "Contact: legal@snap1099.com",
    "deleteAccount": "Delete Account",
    "deleting": "Deleting...",
    "deleteConfirm": "Delete permanently",
    "deleteFailed": "Delete failed. Please try again.",
    "deleteWarningTitle": "Delete all data?",
    "deleteWarningBody": "This will permanently delete all your receipts and account data. This cannot be undone."
  },
  "Auth": {
    "continueWithGoogle": "Continue with Google",
    "signingIn": "Signing in…",
    "signInFailed": "Sign-in failed. Please try again.",
    "saveYourReceipts": "Save your receipts",
    "viewOnAllDevices": "View on all devices",
    "signedIn": "Signed in",
    "cloudBackupOn": "Cloud backup on",
    "account": "Account",
    "notSignedIn": "Not signed in",
    "signInToSync": "Sign in to back up & sync",
    "syncTitle": "View on All Devices",
    "syncStep1": "Sign in with Google on your other device",
    "syncStep2": "Open Snap1099 — your receipts sync automatically",
    "syncStep3": "All devices stay in sync",
    "syncSignedInAs": "Signed in as {email}",
    "softTitle": "Back up your receipts",
    "softBody": "Sign in to keep your data safe across devices.",
    "hardExportTitle": "Sign in to export",
    "hardExportBody": "Google sign-in is required to generate your IRS Tax Pack.",
    "hardSyncTitle": "Sign in to sync",
    "hardSyncBody": "Google sign-in is required to view receipts on all devices."
  },
  "Paywall": {
    "price": "$49.00",
    "oneTimeForSeason": "One-Time for {season} Tax Season",
    "body": "Get your IRS-ready Excel export with categorized deductions, tax savings summary, and Schedule C line items.",
    "payWithPaddle": "Pay $49 with Paddle",
    "openingPaddle": "Opening Paddle…",
    "paymentFailed": "Payment failed. Please try again.",
    "back": "< Back",
    "deviceWarning": "If you switch phones without signing in with Google, your purchase cannot be restored."
  },
  "Pwa": {
    "addToHomeScreen": "Add Snap1099 to Home Screen",
    "subtitle": "Open like a native app — snap receipts one-handed on the job site",
    "install": "Install",
    "notNow": "Not now",
    "manualHint": "Tap ⋮ in Chrome, then Install app",
    "manualSheetTitle": "Install Snap1099",
    "manualGotIt": "Got it",
    "manualStepChromiumAndroid1": "Tap the ⋮ menu (top-right of Chrome).",
    "manualStepChromiumAndroid2": "Tap \"Install app\" or \"Add to Home screen\".",
    "manualStepChromiumAndroid3": "Confirm — Snap1099 opens from your home screen like a native app.",
    "manualStepChromiumDesktop1": "Tap the ⋮ menu (top-right of Chrome or Edge).",
    "manualStepChromiumDesktop2": "Tap \"Apps\" → \"Install Snap1099\" (or \"Install this site\").",
    "manualStepChromiumDesktop3": "Confirm — Snap1099 opens in its own window.",
    "manualStepIosSafari1": "Tap the Share button (square with arrow) at the bottom of Safari.",
    "manualStepIosSafari2": "Scroll and tap \"Add to Home Screen\".",
    "manualStepIosSafari3": "Tap \"Add\" — open Snap1099 from your home screen.",
    "manualStepMacosSafari1": "Tap the Share button in Safari's toolbar.",
    "manualStepMacosSafari2": "Choose \"Add to Dock\".",
    "manualStepMacosSafari3": "Snap1099 appears in your Dock like a native app."
  },
  "Offline": {
    "title": "You're offline",
    "label": "Offline",
    "body": "You can still snap receipts. They'll upload when you're back online.",
    "backHome": "Back to home"
  },
  "Landing": {
    "snap": "Snap",
    "tax": "Tax",
    "engineVersion": "— Engine v1.0 —",
    "loadingToolkit": "Loading your tax-saving toolkit... >>>",
    "irsDeductionLoaded": "IRS deduction database loaded",
    "mileageLoaded": "Mileage categories loaded",
    "equipmentLoaded": "Work equipment deductions loaded",
    "scannerReady": "Receipt scanner ready",
    "vaultOnline": "Secure receipt vault online",
    "snaptaxSystemLog": "Snaptax System Log",
    "logOnline": "Online",
    "logLine1": "Loading IRS categories...",
    "logLine2": "Travel expenses loaded",
    "logLine3": "Fuel deductions loaded",
    "logLine4": "Equipment deductions loaded",
    "logLine5": "Receipt vault online",
    "logLine6": "AI scanner ready",
    "logLine7": "You're one photo away from tax savings.",
    "privateSecure": "100% Private & Secure",
    "privateSecureDesc": "Encrypted sync when online. Local cache on device.",
    "worksOffline": "Works Offline",
    "worksOfflineDesc": "Snap and queue without signal.",
    "builtForWorkers": "Built for Workers",
    "builtForWorkersDesc": "Construction. Trucking. Delivery."
  },
  "Legal": {
    "privacyPolicy": "Privacy Policy",
    "termsOfService": "Terms of Service",
    "close": "Close",
    "lastUpdated": "Last Updated: June 2026 · GDPR & CPRA",
    "openFullPage": "Open full {title} page",
    "complianceFootnote": "By snapping, you agree to our Terms & Privacy Policy. Online processing stores data in the United States.",
    "terms": "Terms",
    "privacyPolicyLink": "Privacy Policy",
    "privacyByDesignTitle": "Privacy by Design",
    "privacyByDesignBody1": "We minimize data collection for receipt categorization and tax-season exports under GDPR and CPRA.",
    "privacyByDesignBody2": "Offline: receipts stay on your device until you are back online.",
    "privacyByDesignBody3": "Online (including before Google Sign-In): we send receipt images to our U.S. servers and OpenAI to categorize your receipt. We do not collect your name or email until you sign in with Google.",
    "dataStorageTitle": "Data Storage & International Transfers",
    "dataStorageBody1": "Receipt images and related data are stored on encrypted cloud servers in the United States.",
    "dataStorageBody2": "By using the App and agreeing to our Terms and Privacy Policy, you acknowledge that your data will be processed in the U.S., which may have different laws than your country.",
    "dataStorageBody3": "We use TLS 1.3 and AES-256 at rest where supported; our providers comply with the EU-U.S. Data Privacy Framework where applicable.",
    "googleSignInTitle": "Google Sign-In",
    "googleSignInBody": "We request profile and email scopes only. We do not access Gmail, Drive, Photos, or Calendar.",
    "subProcessorsTitle": "Sub-Processors",
    "subProcessorsBody": "OpenAI (online receipt analysis, including before sign-in; no training on API data), Paddle, Google, Vercel/Neon/Blob (United States).",
    "noSaleTitle": "No Sale of Data",
    "noSaleBody": "Zero ads. We never sell or share your financial data with marketers or brokers.",
    "yourRightsTitle": "Your Rights",
    "yourRightsBody1": "Access and export receipts in the App. Delete all data via Delete Account in Settings.",
    "yourRightsBody2": "Contact legal@snap1099.com — we aim to respond within 48 hours.",
    "termsServiceTitle": "Service",
    "termsServiceBody": "Snap1099 helps you photograph receipts, categorize expenses with AI, and export spreadsheets for tax prep. This is a tool, not tax or legal advice.",
    "termsAccountsTitle": "Accounts",
    "termsAccountsBody1": "You may use the App with a Ghost ID before Google Sign-In. Online processing stores data in the United States as described in our Privacy Policy.",
    "termsAccountsBody2": "If you change devices without signing in, local data cannot be recovered.",
    "termsPaymentsTitle": "Payments",
    "termsPaymentsBody": "Tax-season export uses Paddle one-time fees.",
    "termsPrivacyTitle": "Privacy",
    "termsPrivacyBody": "Use is governed by our Privacy Policy. By snapping a receipt while online, you agree to these Terms and the Privacy Policy, including U.S. processing.",
    "termsDisclaimerTitle": "Disclaimer & Contact",
    "termsDisclaimerBody1": "The App is provided \"as is\" without warranties.",
    "termsDisclaimerBody2": "Contact: legal@snap1099.com"
  },
  "Industries": {
    "truck_driver": "Truck Driver",
    "plumber": "Plumber",
    "electrician": "Electrician",
    "construction": "Construction",
    "delivery": "Delivery",
    "general": "General 1099"
  },
  "Errors": {
    "UNAUTHORIZED": "Authentication required",
    "GOOGLE_LOGIN_REQUIRED": "Sign in with Google to continue",
    "NOT_FOUND": "Resource not found",
    "FILE_TOO_LARGE": "File exceeds size limit",
    "INVALID_FILE_TYPE": "Only JPEG and PNG are allowed",
    "GHOST_RECEIPT_LIMIT": "Too many receipts for unbound ghost",
    "RATE_LIMITED": "Too many requests",
    "PAYMENT_REQUIRED": "Payment required",
    "NO_RECEIPTS": "No receipts to export",
    "BLOB_CREDENTIALS_MISSING": "Blob storage not configured",
    "OPENAI_UNAVAILABLE": "Receipt analysis is temporarily unavailable",
    "INTERNAL_ERROR": "Something went wrong"
  },
  "DateTime": {
    "today": "Today",
    "yesterday": "Yesterday"
  }
}
```

- [ ] **Step 5: Create `messages/fr.json`**

Same structure as en.json with French translations. Every key from en.json must be present.

*(Full FR JSON below — all ~200+ keys translated)*

```json
{
  "Common": {
    "back": "Retour",
    "cancel": "Annuler",
    "done": "Terminé",
    "delete": "Supprimer",
    "retry": "Réessayer",
    "loading": "Chargement…",
    "offline": "Hors ligne",
    "online": "En ligne",
    "close": "Fermer",
    "notNow": "Pas maintenant",
    "gotIt": "Compris"
  },
  "Home": {
    "estimatedTaxSaved": "Économie d'impôt estimée",
    "receiptsTracked": "{count, plural, one {# reçu} other {# reçus}} suivis",
    "snapReceipt": "Photographier un reçu",
    "takePhoto": "Prenez une photo de votre reçu",
    "resnapReceipt": "Reprendre ce reçu",
    "allLocalReceipts": "Tous les reçus locaux",
    "pullToRefresh": "Tirer pour actualiser",
    "scanning": "Analyse en cours",
    "snapFirstReceipt": "Photographiez votre premier reçu pour commencer",
    "noReceiptsInFilter": "Aucun reçu dans ce filtre",
    "installApp": "Installer l'appli",
    "syncReceipts": "Synchroniser les reçus",
    "settings": "Paramètres",
    "nullTax": "$- - -"
  },
  "ReceiptCard": {
    "uploadPaused": "Envoi en pause",
    "analysisPaused": "Analyse en pause",
    "uploading": "Envoi en cours...",
    "tapToRetry": "Appuyez pour réessayer",
    "processing": "Traitement",
    "receiptBlurry": "Reçu flou",
    "needAction": "Action requise",
    "resnap": "Reprendre",
    "unknownMerchant": "Commerçant inconnu",
    "other": "Autre"
  },
  "ReceiptFilter": {
    "all": "Tous",
    "ready": "Prêts",
    "processing": "En cours",
    "blurry": "Flous",
    "stuckReceipts": "Reçus bloqués"
  },
  "ReceiptStatus": {
    "analyzing": "Analyse",
    "uploading": "Envoi",
    "paused": "En pause"
  },
  "ReceiptDetail": {
    "calculatingDeductions": "Calcul de vos déductions...",
    "taxAiCouldntRead": "L'IA fiscale n'a pas pu lire ce reçu",
    "merchant": "Commerçant",
    "irsLine": "Ligne IRS",
    "addedToScheduleC": "✓ Ajouté aux déductions Schedule C",
    "personalNonDeductible": "Personnel (non déductible)",
    "unknownUnclear": "Inconnu (pas clair)",
    "resetZoom": "Réinitialiser le zoom (1:1)",
    "receiptPreview": "Aperçu du reçu",
    "date": "Date",
    "amount": "Montant",
    "category": "Catégorie",
    "deductible": "Déductible",
    "taxSaved": "Impôt économisé",
    "yes": "Oui",
    "no": "Non",
    "securityNote": "Les données du reçu sont chiffrées en transit et au repos.",
    "blurryTitle": "Reçu flou",
    "blurryBody": "L'IA n'a pas pu lire ce reçu clairement. Veuillez le reprendre.",
    "resnap": "Reprendre",
    "deleteReceipt": "Supprimer le reçu"
  },
  "Camera": {
    "opening": "Ouverture de la caméra…",
    "openFailed": "Impossible d'ouvrir la caméra. Réessayez.",
    "captureFailed": "Capture échouée. Réessayez.",
    "retry": "Réessayer",
    "chooseGallery": "Choisir depuis la galerie",
    "takePhoto": "Prendre une photo",
    "flashDone": "Flash terminé",
    "doneReview": "Terminé et revoir",
    "batchCount": "Lot {count}",
    "back": "< Retour",
    "errorNotAllowed": "L'accès à la caméra est nécessaire pour photographier les reçus. Autorisez la caméra dans les paramètres de votre navigateur.",
    "errorNotFound": "Aucune caméra trouvée",
    "errorNotReadable": "La caméra est utilisée par une autre application",
    "errorDefault": "Impossible d'ouvrir la caméra. Réessayez.",
    "latestPhoto": "Dernière photo de reçu"
  },
  "Settings": {
    "title": "Paramètres",
    "back": "< Retour",
    "yourIndustry": "Votre secteur",
    "multiDevice": "Multi-appareils",
    "viewOnAllDevices": "Voir sur tous les appareils",
    "taxSeasonExport": "Export de saison fiscale",
    "exportTaxPack": "Exporter le dossier fiscal IRS",
    "exportAgain": "Exporter à nouveau",
    "exportFailed": "L'export a échoué. Veuillez réessayer.",
    "exportFailedAfterPayment": "L'export a échoué après le paiement. Réessayez Exporter à nouveau.",
    "shareTitle": "Dossier fiscal Snap1099 {season}",
    "shareText": "Votre export de dépenses prêt pour l'IRS"
  },
  "Privacy": {
    "title": "Confidentialité et données",
    "privacyPolicy": "Politique de confidentialité",
    "termsOfService": "Conditions d'utilisation",
    "dataStorage": "Stockage des données",
    "dataStorageLabel": "Traité et stocké aux États-Unis. Voir la politique de confidentialité pour les transferts internationaux.",
    "contact": "Contact : legal@snap1099.com",
    "deleteAccount": "Supprimer le compte",
    "deleting": "Suppression...",
    "deleteConfirm": "Supprimer définitivement",
    "deleteFailed": "La suppression a échoué. Veuillez réessayer.",
    "deleteWarningTitle": "Supprimer toutes les données ?",
    "deleteWarningBody": "Cela supprimera définitivement tous vos reçus et données de compte. Cette action est irréversible."
  },
  "Auth": {
    "continueWithGoogle": "Continuer avec Google",
    "signingIn": "Connexion en cours…",
    "signInFailed": "La connexion a échoué. Veuillez réessayer.",
    "saveYourReceipts": "Sauvegardez vos reçus",
    "viewOnAllDevices": "Voir sur tous les appareils",
    "signedIn": "Connecté",
    "cloudBackupOn": "Sauvegarde cloud activée",
    "account": "Compte",
    "notSignedIn": "Non connecté",
    "signInToSync": "Connectez-vous pour sauvegarder et synchroniser",
    "syncTitle": "Voir sur tous les appareils",
    "syncStep1": "Connectez-vous avec Google sur votre autre appareil",
    "syncStep2": "Ouvrez Snap1099 — vos reçus se synchronisent automatiquement",
    "syncStep3": "Tous les appareils restent synchronisés",
    "syncSignedInAs": "Connecté en tant que {email}",
    "softTitle": "Sauvegardez vos reçus",
    "softBody": "Connectez-vous pour protéger vos données sur tous les appareils.",
    "hardExportTitle": "Connectez-vous pour exporter",
    "hardExportBody": "La connexion Google est nécessaire pour générer votre dossier fiscal IRS.",
    "hardSyncTitle": "Connectez-vous pour synchroniser",
    "hardSyncBody": "La connexion Google est nécessaire pour voir les reçus sur tous les appareils."
  },
  "Paywall": {
    "price": "49,00 $",
    "oneTimeForSeason": "Paiement unique pour la saison fiscale {season}",
    "body": "Obtenez votre export Excel prêt pour l'IRS avec les déductions catégorisées, le résumé des économies d'impôt et les postes Schedule C.",
    "payWithPaddle": "Payer 49 $ avec Paddle",
    "openingPaddle": "Ouverture de Paddle…",
    "paymentFailed": "Le paiement a échoué. Veuillez réessayer.",
    "back": "< Retour",
    "deviceWarning": "Si vous changez de téléphone sans vous connecter avec Google, votre achat ne pourra pas être restauré."
  },
  "Pwa": {
    "addToHomeScreen": "Ajouter Snap1099 à l'écran d'accueil",
    "subtitle": "Ouvrez comme une appli native — photographiez des reçus d'une main sur le chantier",
    "install": "Installer",
    "notNow": "Pas maintenant",
    "manualHint": "Appuyez sur ⋮ dans Chrome, puis Installer l'appli",
    "manualSheetTitle": "Installer Snap1099",
    "manualGotIt": "Compris",
    "manualStepChromiumAndroid1": "Appuyez sur le menu ⋮ (en haut à droite de Chrome).",
    "manualStepChromiumAndroid2": "Appuyez sur « Installer l'appli » ou « Ajouter à l'écran d'accueil ».",
    "manualStepChromiumAndroid3": "Confirmez — Snap1099 s'ouvre depuis votre écran d'accueil comme une appli native.",
    "manualStepChromiumDesktop1": "Appuyez sur le menu ⋮ (en haut à droite de Chrome ou Edge).",
    "manualStepChromiumDesktop2": "Appuyez sur « Applications » → « Installer Snap1099 » (ou « Installer ce site »).",
    "manualStepChromiumDesktop3": "Confirmez — Snap1099 s'ouvre dans sa propre fenêtre.",
    "manualStepIosSafari1": "Appuyez sur le bouton Partager (carré avec flèche) en bas de Safari.",
    "manualStepIosSafari2": "Faites défiler et appuyez sur « Ajouter à l'écran d'accueil ».",
    "manualStepIosSafari3": "Appuyez sur « Ajouter » — ouvrez Snap1099 depuis votre écran d'accueil.",
    "manualStepMacosSafari1": "Appuyez sur le bouton Partager dans la barre d'outils de Safari.",
    "manualStepMacosSafari2": "Choisissez « Ajouter au Dock ».",
    "manualStepMacosSafari3": "Snap1099 apparaît dans votre Dock comme une appli native."
  },
  "Offline": {
    "title": "Vous êtes hors ligne",
    "label": "Hors ligne",
    "body": "Vous pouvez toujours photographier des reçus. Ils seront envoyés quand vous serez de retour en ligne.",
    "backHome": "Retour à l'accueil"
  },
  "Landing": {
    "snap": "Snap",
    "tax": "Tax",
    "engineVersion": "— Engine v1.0 —",
    "loadingToolkit": "Chargement de votre boîte à outils fiscale... >>>",
    "irsDeductionLoaded": "Base de données des déductions IRS chargée",
    "mileageLoaded": "Catégories de kilométrage chargées",
    "equipmentLoaded": "Déductions d'équipement de travail chargées",
    "scannerReady": "Scanner de reçus prêt",
    "vaultOnline": "Coffre-fort de reçus sécurisé en ligne",
    "snaptaxSystemLog": "Journal système Snaptax",
    "logOnline": "En ligne",
    "logLine1": "Chargement des catégories IRS...",
    "logLine2": "Frais de déplacement chargés",
    "logLine3": "Déductions carburant chargées",
    "logLine4": "Déductions d'équipement chargées",
    "logLine5": "Coffre-fort de reçus en ligne",
    "logLine6": "Scanner IA prêt",
    "logLine7": "Vous êtes à une photo de vos économies d'impôt.",
    "privateSecure": "100 % privé et sécurisé",
    "privateSecureDesc": "Synchronisation chiffrée en ligne. Cache local sur l'appareil.",
    "worksOffline": "Fonctionne hors ligne",
    "worksOfflineDesc": "Photographiez et mettez en file d'attente sans signal.",
    "builtForWorkers": "Conçu pour les travailleurs",
    "builtForWorkersDesc": "Construction. Transport. Livraison."
  },
  "Legal": {
    "privacyPolicy": "Politique de confidentialité",
    "termsOfService": "Conditions d'utilisation",
    "close": "Fermer",
    "lastUpdated": "Dernière mise à jour : juin 2026 · RGPD & CPRA",
    "openFullPage": "Ouvrir la page complète {title}",
    "complianceFootnote": "En photographiant, vous acceptez nos Conditions et notre Politique de confidentialité. Le traitement en ligne stocke les données aux États-Unis.",
    "terms": "Conditions",
    "privacyPolicyLink": "Politique de confidentialité",
    "privacyByDesignTitle": "Protection de la vie privée dès la conception",
    "privacyByDesignBody1": "Nous minimisons la collecte de données pour la catégorisation des reçus et les exports de saison fiscale conformément au RGPD et au CPRA.",
    "privacyByDesignBody2": "Hors ligne : les reçus restent sur votre appareil jusqu'à ce que vous soyez de retour en ligne.",
    "privacyByDesignBody3": "En ligne (y compris avant la connexion Google) : nous envoyons les images des reçus à nos serveurs américains et à OpenAI pour catégoriser votre reçu. Nous ne collectons ni votre nom ni votre e-mail tant que vous ne vous connectez pas avec Google.",
    "dataStorageTitle": "Stockage des données et transferts internationaux",
    "dataStorageBody1": "Les images des reçus et les données associées sont stockées sur des serveurs cloud chiffrés aux États-Unis.",
    "dataStorageBody2": "En utilisant l'application et en acceptant nos Conditions et notre Politique de confidentialité, vous reconnaissez que vos données seront traitées aux États-Unis, qui peuvent avoir des lois différentes de celles de votre pays.",
    "dataStorageBody3": "Nous utilisons TLS 1.3 et AES-256 au repos lorsque c'est possible ; nos fournisseurs sont conformes au cadre de protection des données UE-États-Unis le cas échéant.",
    "googleSignInTitle": "Connexion Google",
    "googleSignInBody": "Nous ne demandons que les autorisations de profil et d'e-mail. Nous n'accédons pas à Gmail, Drive, Photos ou Agenda.",
    "subProcessorsTitle": "Sous-traitants",
    "subProcessorsBody": "OpenAI (analyse des reçus en ligne, y compris avant la connexion ; pas d'entraînement sur les données API), Paddle, Google, Vercel/Neon/Blob (États-Unis).",
    "noSaleTitle": "Aucune vente de données",
    "noSaleBody": "Zéro publicité. Nous ne vendons ni ne partageons jamais vos données financières avec des annonceurs ou des courtiers.",
    "yourRightsTitle": "Vos droits",
    "yourRightsBody1": "Accédez à vos reçus et exportez-les dans l'application. Supprimez toutes les données via Supprimer le compte dans les Paramètres.",
    "yourRightsBody2": "Contactez legal@snap1099.com — nous visons à répondre sous 48 heures.",
    "termsServiceTitle": "Service",
    "termsServiceBody": "Snap1099 vous aide à photographier des reçus, catégoriser les dépenses avec l'IA et exporter des feuilles de calcul pour la préparation fiscale. C'est un outil, pas un conseil fiscal ou juridique.",
    "termsAccountsTitle": "Comptes",
    "termsAccountsBody1": "Vous pouvez utiliser l'application avec un identifiant Ghost avant de vous connecter avec Google. Le traitement en ligne stocke les données aux États-Unis comme décrit dans notre Politique de confidentialité.",
    "termsAccountsBody2": "Si vous changez d'appareil sans vous connecter, les données locales ne pourront pas être récupérées.",
    "termsPaymentsTitle": "Paiements",
    "termsPaymentsBody": "L'export de saison fiscale utilise les paiements uniques Paddle.",
    "termsPrivacyTitle": "Confidentialité",
    "termsPrivacyBody": "L'utilisation est régie par notre Politique de confidentialité. En photographiant un reçu en ligne, vous acceptez ces Conditions et la Politique de confidentialité, y compris le traitement aux États-Unis.",
    "termsDisclaimerTitle": "Avertissement et contact",
    "termsDisclaimerBody1": "L'application est fournie « en l'état » sans garantie.",
    "termsDisclaimerBody2": "Contact : legal@snap1099.com"
  },
  "Industries": {
    "truck_driver": "Chauffeur routier",
    "plumber": "Plombier",
    "electrician": "Électricien",
    "construction": "Construction",
    "delivery": "Livraison",
    "general": "1099 Général"
  },
  "Errors": {
    "UNAUTHORIZED": "Authentification requise",
    "GOOGLE_LOGIN_REQUIRED": "Connectez-vous avec Google pour continuer",
    "NOT_FOUND": "Ressource introuvable",
    "FILE_TOO_LARGE": "Le fichier dépasse la taille limite",
    "INVALID_FILE_TYPE": "Seuls les formats JPEG et PNG sont autorisés",
    "GHOST_RECEIPT_LIMIT": "Trop de reçus pour un compte ghost non lié",
    "RATE_LIMITED": "Trop de requêtes",
    "PAYMENT_REQUIRED": "Paiement requis",
    "NO_RECEIPTS": "Aucun reçu à exporter",
    "BLOB_CREDENTIALS_MISSING": "Stockage blob non configuré",
    "OPENAI_UNAVAILABLE": "L'analyse des reçus est temporairement indisponible",
    "INTERNAL_ERROR": "Une erreur est survenue"
  },
  "DateTime": {
    "today": "Aujourd'hui",
    "yesterday": "Hier"
  }
}
```

- [ ] **Step 6: Create `messages/de.json`**

Same structure with German translations.

```json
{
  "Common": {
    "back": "Zurück",
    "cancel": "Abbrechen",
    "done": "Fertig",
    "delete": "Löschen",
    "retry": "Erneut versuchen",
    "loading": "Laden…",
    "offline": "Offline",
    "online": "Online",
    "close": "Schließen",
    "notNow": "Nicht jetzt",
    "gotIt": "Verstanden"
  },
  "Home": {
    "estimatedTaxSaved": "Geschätzte Steuerersparnis",
    "receiptsTracked": "{count, plural, one {# Beleg} other {# Belege}} erfasst",
    "snapReceipt": "Beleg fotografieren",
    "takePhoto": "Fotografieren Sie Ihren Beleg",
    "resnapReceipt": "Beleg erneut aufnehmen",
    "allLocalReceipts": "Alle lokalen Belege",
    "pullToRefresh": "Zum Aktualisieren ziehen",
    "scanning": "Wird analysiert",
    "snapFirstReceipt": "Fotografieren Sie Ihren ersten Beleg, um zu beginnen",
    "noReceiptsInFilter": "Keine Belege in diesem Filter",
    "installApp": "App installieren",
    "syncReceipts": "Belege synchronisieren",
    "settings": "Einstellungen",
    "nullTax": "$- - -"
  },
  "ReceiptCard": {
    "uploadPaused": "Upload pausiert",
    "analysisPaused": "Analyse pausiert",
    "uploading": "Wird hochgeladen...",
    "tapToRetry": "Tippen zum Wiederholen",
    "processing": "Verarbeitung",
    "receiptBlurry": "Beleg unscharf",
    "needAction": "Aktion erforderlich",
    "resnap": "Erneut aufnehmen",
    "unknownMerchant": "Unbekannter Händler",
    "other": "Sonstiges"
  },
  "ReceiptFilter": {
    "all": "Alle",
    "ready": "Bereit",
    "processing": "In Bearbeitung",
    "blurry": "Unscharf",
    "stuckReceipts": "Festgefahrene Belege"
  },
  "ReceiptStatus": {
    "analyzing": "Analyse",
    "uploading": "Hochladen",
    "paused": "Pausiert"
  },
  "ReceiptDetail": {
    "calculatingDeductions": "Ihre Abzüge werden berechnet...",
    "taxAiCouldntRead": "Die Steuer-KI konnte dies nicht lesen",
    "merchant": "Händler",
    "irsLine": "IRS-Zeile",
    "addedToScheduleC": "✓ Zu Schedule C Abzügen hinzugefügt",
    "personalNonDeductible": "Privat (nicht absetzbar)",
    "unknownUnclear": "Unbekannt (unklar)",
    "resetZoom": "Zoom zurücksetzen (1:1)",
    "receiptPreview": "Belegvorschau",
    "date": "Datum",
    "amount": "Betrag",
    "category": "Kategorie",
    "deductible": "Absetzbar",
    "taxSaved": "Steuerersparnis",
    "yes": "Ja",
    "no": "Nein",
    "securityNote": "Belegdaten werden bei Übertragung und Speicherung verschlüsselt.",
    "blurryTitle": "Unscharfer Beleg",
    "blurryBody": "Die KI konnte diesen Beleg nicht klar lesen. Bitte erneut aufnehmen.",
    "resnap": "Erneut aufnehmen",
    "deleteReceipt": "Beleg löschen"
  },
  "Camera": {
    "opening": "Kamera wird geöffnet…",
    "openFailed": "Kamera konnte nicht geöffnet werden. Versuchen Sie es erneut.",
    "captureFailed": "Aufnahme fehlgeschlagen. Versuchen Sie es erneut.",
    "retry": "Erneut versuchen",
    "chooseGallery": "Aus Galerie wählen",
    "takePhoto": "Foto aufnehmen",
    "flashDone": "Blitz fertig",
    "doneReview": "Fertig & Überprüfen",
    "batchCount": "Stapel {count}",
    "back": "< Zurück",
    "errorNotAllowed": "Kamerazugriff ist erforderlich, um Belege zu fotografieren. Erlauben Sie die Kamera in Ihren Browsereinstellungen.",
    "errorNotFound": "Keine Kamera gefunden",
    "errorNotReadable": "Die Kamera wird von einer anderen App verwendet",
    "errorDefault": "Kamera konnte nicht geöffnet werden. Versuchen Sie es erneut.",
    "latestPhoto": "Letztes Belegfoto"
  },
  "Settings": {
    "title": "Einstellungen",
    "back": "< Zurück",
    "yourIndustry": "Ihre Branche",
    "multiDevice": "Multi-Gerät",
    "viewOnAllDevices": "Auf allen Geräten anzeigen",
    "taxSeasonExport": "Steuersaison-Export",
    "exportTaxPack": "IRS-Steuerpaket exportieren",
    "exportAgain": "Erneut exportieren",
    "exportFailed": "Export fehlgeschlagen. Bitte versuchen Sie es erneut.",
    "exportFailedAfterPayment": "Export nach Zahlung fehlgeschlagen. Versuchen Sie Erneut exportieren.",
    "shareTitle": "Snap1099 Steuerpaket {season}",
    "shareText": "Ihr IRS-fertiger Ausgabenexport"
  },
  "Privacy": {
    "title": "Datenschutz & Daten",
    "privacyPolicy": "Datenschutzrichtlinie",
    "termsOfService": "Nutzungsbedingungen",
    "dataStorage": "Datenspeicherung",
    "dataStorageLabel": "Verarbeitet und gespeichert in den Vereinigten Staaten. Siehe Datenschutzrichtlinie für internationale Übertragungen.",
    "contact": "Kontakt: legal@snap1099.com",
    "deleteAccount": "Konto löschen",
    "deleting": "Wird gelöscht...",
    "deleteConfirm": "Endgültig löschen",
    "deleteFailed": "Löschung fehlgeschlagen. Bitte versuchen Sie es erneut.",
    "deleteWarningTitle": "Alle Daten löschen?",
    "deleteWarningBody": "Dadurch werden alle Ihre Belege und Kontodaten dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden."
  },
  "Auth": {
    "continueWithGoogle": "Weiter mit Google",
    "signingIn": "Anmeldung läuft…",
    "signInFailed": "Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.",
    "saveYourReceipts": "Sichern Sie Ihre Belege",
    "viewOnAllDevices": "Auf allen Geräten anzeigen",
    "signedIn": "Angemeldet",
    "cloudBackupOn": "Cloud-Backup aktiviert",
    "account": "Konto",
    "notSignedIn": "Nicht angemeldet",
    "signInToSync": "Anmelden zum Sichern & Synchronisieren",
    "syncTitle": "Auf allen Geräten anzeigen",
    "syncStep1": "Melden Sie sich mit Google auf Ihrem anderen Gerät an",
    "syncStep2": "Öffnen Sie Snap1099 — Ihre Belege werden automatisch synchronisiert",
    "syncStep3": "Alle Geräte bleiben synchron",
    "syncSignedInAs": "Angemeldet als {email}",
    "softTitle": "Sichern Sie Ihre Belege",
    "softBody": "Melden Sie sich an, um Ihre Daten geräteübergreifend zu schützen.",
    "hardExportTitle": "Anmelden zum Exportieren",
    "hardExportBody": "Die Google-Anmeldung ist erforderlich, um Ihr IRS-Steuerpaket zu erstellen.",
    "hardSyncTitle": "Anmelden zum Synchronisieren",
    "hardSyncBody": "Die Google-Anmeldung ist erforderlich, um Belege auf allen Geräten anzuzeigen."
  },
  "Paywall": {
    "price": "49,00 $",
    "oneTimeForSeason": "Einmalzahlung für die Steuersaison {season}",
    "body": "Erhalten Sie Ihren IRS-fertigen Excel-Export mit kategorisierten Abzügen, Steuerersparniszusammenfassung und Schedule-C-Posten.",
    "payWithPaddle": "49 $ mit Paddle bezahlen",
    "openingPaddle": "Paddle wird geöffnet…",
    "paymentFailed": "Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut.",
    "back": "< Zurück",
    "deviceWarning": "Wenn Sie Ihr Telefon wechseln, ohne sich mit Google anzumelden, kann Ihr Kauf nicht wiederhergestellt werden."
  },
  "Pwa": {
    "addToHomeScreen": "Snap1099 zum Startbildschirm hinzufügen",
    "subtitle": "Öffnen wie eine native App — Belege einhändig auf der Baustelle fotografieren",
    "install": "Installieren",
    "notNow": "Nicht jetzt",
    "manualHint": "Tippen Sie auf ⋮ in Chrome, dann App installieren",
    "manualSheetTitle": "Snap1099 installieren",
    "manualGotIt": "Verstanden",
    "manualStepChromiumAndroid1": "Tippen Sie auf das ⋮-Menü (oben rechts in Chrome).",
    "manualStepChromiumAndroid2": "Tippen Sie auf „App installieren" oder „Zum Startbildschirm hinzufügen".",
    "manualStepChromiumAndroid3": "Bestätigen — Snap1099 öffnet sich von Ihrem Startbildschirm wie eine native App.",
    "manualStepChromiumDesktop1": "Tippen Sie auf das ⋮-Menü (oben rechts in Chrome oder Edge).",
    "manualStepChromiumDesktop2": "Tippen Sie auf „Apps" → „Snap1099 installieren" (oder „Diese Website installieren").",
    "manualStepChromiumDesktop3": "Bestätigen — Snap1099 öffnet sich in einem eigenen Fenster.",
    "manualStepIosSafari1": "Tippen Sie auf die Teilen-Taste (Quadrat mit Pfeil) am unteren Rand von Safari.",
    "manualStepIosSafari2": "Scrollen Sie und tippen Sie auf „Zum Home-Bildschirm".",
    "manualStepIosSafari3": "Tippen Sie auf „Hinzufügen" — öffnen Sie Snap1099 von Ihrem Startbildschirm.",
    "manualStepMacosSafari1": "Tippen Sie auf die Teilen-Taste in der Safari-Symbolleiste.",
    "manualStepMacosSafari2": "Wählen Sie „Zum Dock hinzufügen".",
    "manualStepMacosSafari3": "Snap1099 erscheint in Ihrem Dock wie eine native App."
  },
  "Offline": {
    "title": "Sie sind offline",
    "label": "Offline",
    "body": "Sie können weiterhin Belege fotografieren. Sie werden hochgeladen, sobald Sie wieder online sind.",
    "backHome": "Zurück zur Startseite"
  },
  "Landing": {
    "snap": "Snap",
    "tax": "Tax",
    "engineVersion": "— Engine v1.0 —",
    "loadingToolkit": "Ihr Steuer-Toolkit wird geladen... >>>",
    "irsDeductionLoaded": "IRS-Abzugsdatenbank geladen",
    "mileageLoaded": "Kilometerkategorien geladen",
    "equipmentLoaded": "Arbeitsgeräte-Abzüge geladen",
    "scannerReady": "Belegscanner bereit",
    "vaultOnline": "Sicherer Belegtresor online",
    "snaptaxSystemLog": "Snaptax Systemprotokoll",
    "logOnline": "Online",
    "logLine1": "IRS-Kategorien werden geladen...",
    "logLine2": "Reisekosten geladen",
    "logLine3": "Kraftstoffabzüge geladen",
    "logLine4": "Ausrüstungsabzüge geladen",
    "logLine5": "Belegtresor online",
    "logLine6": "KI-Scanner bereit",
    "logLine7": "Sie sind nur ein Foto von Ihren Steuerersparnissen entfernt.",
    "privateSecure": "100 % privat & sicher",
    "privateSecureDesc": "Verschlüsselte Synchronisation bei Verbindung. Lokaler Cache auf dem Gerät.",
    "worksOffline": "Funktioniert offline",
    "worksOfflineDesc": "Fotografieren und in Warteschlange stellen ohne Signal.",
    "builtForWorkers": "Für Arbeiter gebaut",
    "builtForWorkersDesc": "Bau. Transport. Lieferung."
  },
  "Legal": {
    "privacyPolicy": "Datenschutzrichtlinie",
    "termsOfService": "Nutzungsbedingungen",
    "close": "Schließen",
    "lastUpdated": "Letzte Aktualisierung: Juni 2026 · DSGVO & CPRA",
    "openFullPage": "Vollständige Seite {title} öffnen",
    "complianceFootnote": "Durch das Fotografieren stimmen Sie unseren Nutzungsbedingungen und unserer Datenschutzrichtlinie zu. Die Online-Verarbeitung speichert Daten in den Vereinigten Staaten.",
    "terms": "Bedingungen",
    "privacyPolicyLink": "Datenschutzrichtlinie",
    "privacyByDesignTitle": "Datenschutz durch Technikgestaltung",
    "privacyByDesignBody1": "Wir minimieren die Datenerfassung für die Belegkategorisierung und Steuersaison-Exporte gemäß DSGVO und CPRA.",
    "privacyByDesignBody2": "Offline: Belege bleiben auf Ihrem Gerät, bis Sie wieder online sind.",
    "privacyByDesignBody3": "Online (auch vor der Google-Anmeldung): Wir senden Belegbilder an unsere US-Server und OpenAI, um Ihren Beleg zu kategorisieren. Wir erfassen weder Ihren Namen noch Ihre E-Mail, bis Sie sich mit Google anmelden.",
    "dataStorageTitle": "Datenspeicherung & internationale Übertragungen",
    "dataStorageBody1": "Belegbilder und zugehörige Daten werden auf verschlüsselten Cloud-Servern in den Vereinigten Staaten gespeichert.",
    "dataStorageBody2": "Durch die Nutzung der App und die Zustimmung zu unseren Bedingungen und Datenschutzrichtlinie erkennen Sie an, dass Ihre Daten in den USA verarbeitet werden, die möglicherweise andere Gesetze als Ihr Land haben.",
    "dataStorageBody3": "Wir verwenden TLS 1.3 und AES-256 im Ruhezustand, wo unterstützt; unsere Anbieter entsprechen dem EU-US-Datenschutzrahmen, wo anwendbar.",
    "googleSignInTitle": "Google-Anmeldung",
    "googleSignInBody": "Wir fordern nur Profil- und E-Mail-Berechtigungen an. Wir greifen nicht auf Gmail, Drive, Fotos oder Kalender zu.",
    "subProcessorsTitle": "Unterauftragsverarbeiter",
    "subProcessorsBody": "OpenAI (Online-Beleganalyse, auch vor der Anmeldung; kein Training mit API-Daten), Paddle, Google, Vercel/Neon/Blob (Vereinigte Staaten).",
    "noSaleTitle": "Kein Datenverkauf",
    "noSaleBody": "Keine Werbung. Wir verkaufen oder teilen Ihre Finanzdaten niemals mit Werbetreibenden oder Maklern.",
    "yourRightsTitle": "Ihre Rechte",
    "yourRightsBody1": "Greifen Sie auf Belege zu und exportieren Sie diese in der App. Löschen Sie alle Daten über Konto löschen in den Einstellungen.",
    "yourRightsBody2": "Kontaktieren Sie legal@snap1099.com — wir bemühen uns, innerhalb von 48 Stunden zu antworten.",
    "termsServiceTitle": "Service",
    "termsServiceBody": "Snap1099 hilft Ihnen, Belege zu fotografieren, Ausgaben mit KI zu kategorisieren und Tabellen für die Steuervorbereitung zu exportieren. Dies ist ein Werkzeug, keine Steuer- oder Rechtsberatung.",
    "termsAccountsTitle": "Konten",
    "termsAccountsBody1": "Sie können die App mit einer Ghost-ID vor der Google-Anmeldung nutzen. Die Online-Verarbeitung speichert Daten in den Vereinigten Staaten wie in unserer Datenschutzrichtlinie beschrieben.",
    "termsAccountsBody2": "Wenn Sie das Gerät wechseln, ohne sich anzumelden, können lokale Daten nicht wiederhergestellt werden.",
    "termsPaymentsTitle": "Zahlungen",
    "termsPaymentsBody": "Der Steuersaison-Export verwendet einmalige Paddle-Gebühren.",
    "termsPrivacyTitle": "Datenschutz",
    "termsPrivacyBody": "Die Nutzung unterliegt unserer Datenschutzrichtlinie. Durch das Fotografieren eines Belegs im Online-Modus stimmen Sie diesen Bedingungen und der Datenschutzrichtlinie zu, einschließlich der US-Verarbeitung.",
    "termsDisclaimerTitle": "Haftungsausschluss & Kontakt",
    "termsDisclaimerBody1": "Die App wird „wie besehen" ohne Garantien bereitgestellt.",
    "termsDisclaimerBody2": "Kontakt: legal@snap1099.com"
  },
  "Industries": {
    "truck_driver": "LKW-Fahrer",
    "plumber": "Klempner",
    "electrician": "Elektriker",
    "construction": "Bau",
    "delivery": "Lieferung",
    "general": "Allgemein 1099"
  },
  "Errors": {
    "UNAUTHORIZED": "Authentifizierung erforderlich",
    "GOOGLE_LOGIN_REQUIRED": "Melden Sie sich mit Google an, um fortzufahren",
    "NOT_FOUND": "Ressource nicht gefunden",
    "FILE_TOO_LARGE": "Datei überschreitet das Größenlimit",
    "INVALID_FILE_TYPE": "Nur JPEG und PNG sind erlaubt",
    "GHOST_RECEIPT_LIMIT": "Zu viele Belege für ungebundenes Ghost-Konto",
    "RATE_LIMITED": "Zu viele Anfragen",
    "PAYMENT_REQUIRED": "Zahlung erforderlich",
    "NO_RECEIPTS": "Keine Belege zum Exportieren",
    "BLOB_CREDENTIALS_MISSING": "Blob-Speicher nicht konfiguriert",
    "OPENAI_UNAVAILABLE": "Die Beleganalyse ist vorübergehend nicht verfügbar",
    "INTERNAL_ERROR": "Etwas ist schiefgelaufen"
  },
  "DateTime": {
    "today": "Heute",
    "yesterday": "Gestern"
  }
}
```

- [ ] **Step 7: Update `next.config.ts`**

Wrap with `createNextIntlPlugin`. The Serwist wrapper stays as the outermost wrapper.

```ts
import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID:
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
      process.env.GOOGLE_CLIENT_ID ??
      "",
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN:
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ??
      process.env.PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN ??
      "",
    NEXT_PUBLIC_PADDLE_PRICE_ID:
      process.env.NEXT_PUBLIC_PADDLE_PRICE_ID ??
      process.env.PADDLE_SNAPTAX_PRICE_KEY ??
      "",
  },
};

export default withSerwist(withNextIntl(nextConfig));
```

- [ ] **Step 8: Create `lib/client/locale.ts`**

```ts
import { locales, defaultLocale, type Locale } from "@/i18n/config";

const LOCALE_COOKIE = "NEXT_LOCALE";

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return defaultLocale;
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const tag of langs) {
    const base = tag.split("-")[0]?.toLowerCase();
    if (base && (locales as readonly string[]).includes(base)) {
      return base as Locale;
    }
  }
  return defaultLocale;
}

export function ensureLocaleCookie(): Locale {
  const existing = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${LOCALE_COOKIE}=`))
    ?.split("=")[1];
  if (existing && (locales as readonly string[]).includes(existing)) {
    return existing as Locale;
  }
  const detected = detectBrowserLocale();
  document.cookie = `${LOCALE_COOKIE}=${detected};path=/;max-age=31536000;SameSite=Lax`;
  return detected;
}
```

- [ ] **Step 9: Create `components/i18n/LocaleInitializer.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { ensureLocaleCookie } from "@/lib/client/locale";

export function LocaleInitializer() {
  useEffect(() => {
    ensureLocaleCookie();
  }, []);
  return null;
}
```

- [ ] **Step 10: Update `app/layout.tsx`**

Add `NextIntlClientProvider`, `LocaleInitializer`, and dynamic `lang` attribute.

Replace the existing layout with:

```tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { LocaleInitializer } from "@/components/i18n/LocaleInitializer";
import { USER_COPY } from "@/lib/copy/userFacing";
import { INLINE_INSTALL_CAPTURE_SCRIPT } from "@/lib/pwa/installCaptureScript";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = "Snap1099";
const APP_DESCRIPTION = USER_COPY.app.description;

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icon", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-full flex-col">
        <script
          dangerouslySetInnerHTML={{ __html: INLINE_INSTALL_CAPTURE_SCRIPT }}
        />
        <NextIntlClientProvider>
          <LocaleInitializer />
          <PwaProvider>{children}</PwaProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 11: Verify build succeeds**

```bash
npm run build
```

Expected: Build succeeds. If Serwist + next-intl plugin conflict, try reversing the wrapper order: `withNextIntl(withSerwist(nextConfig))`.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(i18n): add next-intl infrastructure with en/fr/de message files

- Install next-intl v4.12+
- Create i18n/config.ts and i18n/request.ts (cookie-based locale)
- Create messages/en.json, messages/fr.json, messages/de.json
- Create LocaleInitializer client component for browser locale detection
- Update next.config.ts with createNextIntlPlugin
- Update app/layout.tsx with NextIntlClientProvider and dynamic lang"
```

---

## Task 2: Migrate Home UI Components

**Files:**
- Modify: `components/home/TaxHeader.tsx`
- Modify: `components/home/SnapButton.tsx`
- Modify: `components/home/StatusPill.tsx`
- Modify: `components/home/ReceiptList.tsx`
- Modify: `components/home/ReceiptListCard.tsx`
- Modify: `components/home/ReceiptFilterBar.tsx`
- Modify: `components/home/HomeScreen.tsx`

For each component: add `import { useTranslations } from "next-intl"`, call `const t = useTranslations('Namespace')`, replace every hardcoded string with `t('key')` or `t('key', { param })`.

- [ ] **Step 1: Migrate `TaxHeader.tsx`**

Replace hardcoded strings with `useTranslations('Home')`:

- `"Estimated Tax Saved"` → `t('estimatedTaxSaved')`
- `"$- - -"` → `t('nullTax')`
- `` `1 receipt` / `${n} receipts` `` → `t('receiptsTracked', { count: receiptCount })`
- `" tracked"` (suffix) → included in the `receiptsTracked` ICU pattern
- `formatCurrency(totalExpenses)` stays (currency is region-based, not locale-based)
- aria labels: `"Install app"` → `t('installApp')`, `"Sync receipts"` → `t('syncReceipts')`, `"Settings"` → `t('settings')`

Add `import { useTranslations } from "next-intl";` and inside the function body: `const t = useTranslations("Home");`

- [ ] **Step 2: Migrate `StatusPill.tsx`**

Replace `LABEL` map with `useTranslations('ReceiptStatus')`:
- `"ANALYZING"` → `t('analyzing')`
- `"UPLOADING"` → `t('uploading')`
- `"PAUSED"` → `t('paused')`

Add `import { useTranslations } from "next-intl";`, call `const t = useTranslations("ReceiptStatus");`, remove `LABEL` constant, call `t(variant)` using the variant key directly.

- [ ] **Step 3: Migrate `ReceiptListCard.tsx`**

Replace with `useTranslations('ReceiptCard')`:
- `"UPLOAD PAUSED"` → `t('uploadPaused')`
- `"ANALYSIS PAUSED"` → `t('analysisPaused')`
- `"UPLOADING..."` → `t('uploading')`
- `"Tap to retry"` → `t('tapToRetry')`
- `"Processing"` → `t('processing')`
- `"Receipt Blurry"` → `t('receiptBlurry')`
- `"Need Action"` → `t('needAction')`
- `"Resnap"` → `t('resnap')`
- `"Unknown merchant"` → `t('unknownMerchant')`
- `"OTHER"` → `t('other')`

- [ ] **Step 4: Migrate `ReceiptFilterBar.tsx`**

Replace with `useTranslations('ReceiptFilter')`:
- `"ALL"` → `t('all')`
- `"READY"` → `t('ready')`
- `"PROCESSING"` → `t('processing')`
- `"BLURRY"` → `t('blurry')`
- Stuck aria: → `t('stuckReceipts')`

Change `FILTERS` array to use `t()` calls for labels instead of hardcoded strings.

- [ ] **Step 5: Migrate `ReceiptList.tsx`**

Replace with `useTranslations('Home')`:
- `"All Local Receipts"` → `t('allLocalReceipts')`
- `"Pull to refresh"` → `t('pullToRefresh')`
- `"Snap your first receipt to get started"` → `t('snapFirstReceipt')`
- `"No receipts in this filter"` → `t('noReceiptsInFilter')`

- [ ] **Step 6: Migrate `SnapButton.tsx`**

Replace with `useTranslations('Home')`:
- `"Snap Receipt"` → `t('snapReceipt')`
- `"Resnap this receipt"` → `t('resnapReceipt')`
- `"Take a photo of your receipt"` → `t('takePhoto')`

- [ ] **Step 7: Migrate `HomeScreen.tsx`**

Replace with `useTranslations('Home')`:
- `merchant: "Scanning"` → `merchant: t('scanning')` (two locations ~L544 and ~L641)

Add `import { useTranslations } from "next-intl";` and `const t = useTranslations("Home");` at the top of the component body.

- [ ] **Step 8: Verify build**

```bash
npm run build
```

Expected: Build succeeds with no translation key errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(i18n): migrate home UI components to useTranslations

- TaxHeader, SnapButton, StatusPill, ReceiptList, ReceiptListCard,
  ReceiptFilterBar, HomeScreen all use next-intl translations"
```

---

## Task 3: Migrate Camera Components

**Files:**
- Modify: `components/camera/CameraOverlay.tsx`
- Modify: `components/camera/CameraLiveFooter.tsx`
- Modify: `components/camera/CameraShutterControl.tsx`
- Modify: `components/camera/ReceiptReviewControls.tsx`
- Modify: `components/camera/FlashDoneButton.tsx`
- Modify: `components/camera/ReviewDoneButton.tsx`
- Modify: `components/camera/BatchCountBadge.tsx`
- Modify: `components/camera/BatchGalleryStrip.tsx`

- [ ] **Step 1: Migrate `CameraOverlay.tsx`**

This is the largest camera file. Remove `import { USER_COPY } from "@/lib/copy/userFacing"` and replace with `useTranslations('Camera')`:

- `USER_COPY.camera.openFailed` → `t('openFailed')`
- `USER_COPY.camera.captureFailed` → `t('captureFailed')`
- `USER_COPY.camera.opening` → `t('opening')`
- `USER_COPY.camera.retry` → `t('retry')`
- `USER_COPY.camera.chooseGallery` → `t('chooseGallery')`
- `"< BACK"` → `t('back')`
- `getCameraErrorMessage(err)` — this function uses `USER_COPY.camera.errors.*`; change it to accept translated strings or pass the `t` function

For `getCameraErrorMessage`, update `lib/camera/capturePhoto.ts` to accept an error map instead of importing `USER_COPY`:

```ts
export type CameraErrorMessages = {
  notAllowed: string;
  notFound: string;
  notReadable: string;
  default: string;
};

export function getCameraErrorMessage(
  err: unknown,
  messages: CameraErrorMessages,
): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotAllowedError": return messages.notAllowed;
      case "NotFoundError": return messages.notFound;
      case "NotReadableError": return messages.notReadable;
      case "AbortError": return messages.default;
      default: return messages.default;
    }
  }
  return messages.default;
}
```

In `CameraOverlay.tsx`, build the error map from translations:

```tsx
const t = useTranslations("Camera");
const errorMessages: CameraErrorMessages = {
  notAllowed: t("errorNotAllowed"),
  notFound: t("errorNotFound"),
  notReadable: t("errorNotReadable"),
  default: t("errorDefault"),
};
// Then: getCameraErrorMessage(err, errorMessages)
```

- [ ] **Step 2: Migrate remaining camera subcomponents**

For each of `CameraLiveFooter.tsx`, `CameraShutterControl.tsx`, `FlashDoneButton.tsx`, `ReviewDoneButton.tsx`, `BatchCountBadge.tsx`:

- Add `import { useTranslations } from "next-intl";`
- Replace hardcoded strings with `t('key')` calls

For `ReceiptReviewControls.tsx`:
- `"Delete"` → `useTranslations('Common')('delete')`
- `"Resnap"` → `useTranslations('ReceiptDetail')('resnap')`
- `"Done"` → `useTranslations('Common')('done')`

For `BatchGalleryStrip.tsx`:
- aria text `"Latest receipt photo"` → `useTranslations('Camera')('latestPhoto')`

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(i18n): migrate camera components to useTranslations

- CameraOverlay no longer imports USER_COPY
- getCameraErrorMessage accepts translated error map
- All camera subcomponents use next-intl"
```

---

## Task 4: Migrate Settings, Auth, and Paywall

**Files:**
- Modify: `components/settings/SettingsScreen.tsx`
- Modify: `components/settings/PrivacyDataSection.tsx`
- Modify: `components/settings/PaywallSheet.tsx`
- Modify: `components/auth/GoogleSignInSheet.tsx`
- Modify: `components/auth/SyncInstructionsSheet.tsx`
- Modify: `components/auth/AccountStatusBlock.tsx`

- [ ] **Step 1: Migrate `SettingsScreen.tsx`**

Replace with `useTranslations('Settings')`:
- `"< BACK"` → `t('back')`
- `"Settings"` → `t('title')`
- `"Your Industry"` → `t('yourIndustry')`
- `"Multi-Device"` → `t('multiDevice')`
- `"View on All Devices"` → `t('viewOnAllDevices')`
- `"Tax Season Export"` → `t('taxSeasonExport')`
- `"Export Again"` / `"Export IRS Tax Pack"` → `t('exportAgain')` / `t('exportTaxPack')`
- Error messages → `t('exportFailed')`, `t('exportFailedAfterPayment')`
- Share title/text → `t('shareTitle', { season })`, `t('shareText')`

For industry labels, use `useTranslations('Industries')` and look up `tIndustry(item.id)` instead of `item.label`.

- [ ] **Step 2: Migrate `PrivacyDataSection.tsx`**

Replace with `useTranslations('Privacy')`:
- All section headers, button labels, confirm dialog text

- [ ] **Step 3: Migrate `PaywallSheet.tsx`**

Replace with `useTranslations('Paywall')`:
- `"$49.00"` → `t('price')`
- `"One-Time for {season} Tax Season"` → `t('oneTimeForSeason', { season })`
- `"Pay $49 with Paddle"` → `t('payWithPaddle')`
- `"Opening Paddle…"` → `t('openingPaddle')`
- `"< BACK"` → `t('back')`
- Device warning → `t('deviceWarning')`

- [ ] **Step 4: Migrate `GoogleSignInSheet.tsx`**

Remove the inline `COPY` record. Replace with `useTranslations('Auth')`:
- Mode-dependent title/body uses `t('softTitle')`, `t('hardExportTitle')`, etc.
- `"Continue with Google"` → `t('continueWithGoogle')`
- `"Not now"` → `useTranslations('Common')('notNow')`
- Error → `t('signInFailed')`

- [ ] **Step 5: Migrate `SyncInstructionsSheet.tsx`**

Replace with `useTranslations('Auth')`:
- Title → `t('syncTitle')`
- Steps → `t('syncStep1')`, `t('syncStep2')`, `t('syncStep3')`
- `"Got it"` → `useTranslations('Common')('gotIt')`

- [ ] **Step 6: Migrate `AccountStatusBlock.tsx`**

Replace with `useTranslations('Auth')`:
- `"Account"` → `t('account')`
- Signed in/out states
- `"Continue with Google"` → `t('continueWithGoogle')`

- [ ] **Step 7: Verify build**

```bash
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(i18n): migrate settings, auth, and paywall components

- SettingsScreen, PrivacyDataSection, PaywallSheet use translations
- GoogleSignInSheet, SyncInstructionsSheet, AccountStatusBlock use translations
- Removed inline COPY records in favor of messages JSON"
```

---

## Task 5: Migrate Landing, PWA, Offline, Legal, and Receipt Detail

**Files:**
- Modify: `components/landing/DataStreamHero.tsx`
- Modify: `components/landing/DataStreamChecklist.tsx`
- Modify: `components/landing/DataStreamLog.tsx`
- Modify: `components/landing/DataStreamFooter.tsx`
- Modify: `components/landing/LandingGate.tsx`
- Modify: `components/pwa/InstallPrompt.tsx`
- Modify: `components/pwa/InstallManualSheet.tsx`
- Modify: `app/offline/page.tsx`
- Modify: `components/legal/ComplianceFootnote.tsx`
- Modify: `components/legal/LegalSheet.tsx`
- Modify: `components/receipts/ReceiptDetailSheet.tsx`

- [ ] **Step 1: Migrate landing components**

For Server Components (`DataStreamHero`, `DataStreamChecklist`, `DataStreamLog`, `DataStreamFooter`): use `getTranslations('Landing')` from `"next-intl/server"`.

For Client Component (`LandingGate`): use `useTranslations('Landing')`.

Remove imports from `dataStreamCopy.ts`. Use translation keys like `t('loadingToolkit')`, `t('irsDeductionLoaded')`, etc.

- [ ] **Step 2: Migrate PWA components**

For `InstallPrompt.tsx`: replace `USER_COPY.pwa.*` → `useTranslations('Pwa')`:
- `USER_COPY.pwa.title` → `t('addToHomeScreen')`
- `USER_COPY.pwa.subtitle` → `t('subtitle')`
- `USER_COPY.pwa.install` → `t('install')`
- `USER_COPY.pwa.dismiss` → `t('notNow')`

For `InstallManualSheet.tsx`: replace `USER_COPY.pwa.manual*` → `useTranslations('Pwa')`:
- Manual steps use keyed translations like `t('manualStepChromiumAndroid1')` etc.

- [ ] **Step 3: Migrate `app/offline/page.tsx`**

This is a Server Component. Use `getTranslations`:

```tsx
import { getTranslations } from "next-intl/server";

export default async function OfflinePage() {
  const t = await getTranslations("Offline");
  return (
    // ... replace USER_COPY.offline.title → t('title'), etc.
  );
}
```

Remove `import { USER_COPY }` from this file.

- [ ] **Step 4: Migrate legal components**

For `ComplianceFootnote.tsx`: replace hardcoded footnote text with `useTranslations('Legal')`:
- `"By snapping, you agree to our "` + `"Terms"` + `" & "` + `"Privacy Policy"` + `"..."` → Use `t('complianceFootnote')` for the full string, or compose from `t('terms')` and `t('privacyPolicyLink')` parts

For `LegalSheet.tsx`: replace `getLegalTitle()` / `getLegalSections()` with translation lookups from `useTranslations('Legal')`. The legal sections are now keyed in messages JSON (e.g., `t('privacyByDesignTitle')`, `t('privacyByDesignBody1')`).

- [ ] **Step 5: Migrate `ReceiptDetailSheet.tsx`**

Replace with `useTranslations('ReceiptDetail')`:
- `"Calculating your deductions..."` → `t('calculatingDeductions')`
- `"Tax AI Couldn't Read This"` → `t('taxAiCouldntRead')`
- All detail row labels, status messages, action buttons

- [ ] **Step 6: Verify build**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(i18n): migrate landing, PWA, offline, legal, and receipt detail

- Landing components use getTranslations (Server) / useTranslations (Client)
- PWA install prompts no longer use USER_COPY
- Offline page uses getTranslations
- Legal sheets use translated sections
- ReceiptDetailSheet fully internationalized"
```

---

## Task 6: Cleanup — Remove Old Copy Files and Update Helpers

**Files:**
- Delete: `lib/copy/userFacing.ts`
- Delete: `components/landing/dataStreamCopy.ts`
- Modify: `lib/legal/content.ts` — refactor to read from messages or remove
- Modify: `lib/format.ts` — add `translations` parameter for Today/Yesterday
- Modify: `lib/types.ts` — change INDUSTRIES to use i18n keys
- Modify: `app/manifest.ts` — remove USER_COPY import (use hardcoded brand name)

- [ ] **Step 1: Delete `lib/copy/userFacing.ts`**

First verify no remaining imports:

```bash
rg "userFacing" --glob '*.{ts,tsx}' -l
```

If any files still import it, update them. Then delete the file.

- [ ] **Step 2: Delete `components/landing/dataStreamCopy.ts`**

First verify no remaining imports:

```bash
rg "dataStreamCopy" --glob '*.{ts,tsx}' -l
```

Delete after confirming zero references.

- [ ] **Step 3: Refactor `lib/legal/content.ts`**

The legal content is now in `messages/*.json` under the `Legal` namespace. Remove the hardcoded sections from `content.ts`. Keep only the type definitions and `LEGAL_CONTACT_EMAIL` if still used:

```ts
export type LegalDoc = "privacy" | "terms";
export const LEGAL_CONTACT_EMAIL = "legal@snap1099.com";
```

Functions like `getLegalSections()`, `getLegalTitle()`, `formatDataStorageLabel()`, and the section arrays should be removed. Components that used them now use `useTranslations('Legal')`.

- [ ] **Step 4: Update `lib/format.ts`**

Add optional `translations` parameter to `formatReceiptTime`:

```ts
export function formatReceiptTime(
  date: Date,
  region: TaxRegion = "us",
  translations?: { today: string; yesterday: string },
): string {
  const now = new Date();
  const locale = localeForRegion(region);
  const time = formatClockTime(date, region);

  if (isSameLocalCalendarDay(date, now))
    return `${translations?.today ?? "Today"}, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameLocalCalendarDay(date, yesterday))
    return `${translations?.yesterday ?? "Yesterday"}, ${time}`;

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
```

Update callers (e.g., `ReceiptListCard.tsx`) to pass translations:

```tsx
const tDt = useTranslations("DateTime");
const dateStr = formatReceiptTime(receipt.timestamp, region, {
  today: tDt("today"),
  yesterday: tDt("yesterday"),
});
```

Also update `formatReceiptDetailLongDateTime` to remove the hardcoded `" at "`:

```ts
export function formatReceiptDetailLongDateTime(
  date: Date,
  timeZone = "UTC",
  region: TaxRegion = "us",
): string {
  const locale = localeForRegion(region);
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: region === "us",
  }).format(date);
}
```

This uses Intl.DateTimeFormat's built-in locale-aware formatting instead of manual concatenation with "at".

- [ ] **Step 5: Update `lib/types.ts`**

Change `INDUSTRIES` to use the i18n key as the label (components will use `useTranslations('Industries')` to display):

```ts
export const INDUSTRIES: { id: Industry; labelKey: string }[] = [
  { id: "truck_driver", labelKey: "truck_driver" },
  { id: "plumber", labelKey: "plumber" },
  { id: "electrician", labelKey: "electrician" },
  { id: "construction", labelKey: "construction" },
  { id: "delivery", labelKey: "delivery" },
  { id: "general", labelKey: "general" },
];
```

Update `SettingsScreen.tsx` to use `tIndustry(item.labelKey)` for display.

- [ ] **Step 6: Update `app/manifest.ts`**

Replace `USER_COPY.app.description` import with a hardcoded brand description (manifest is language-neutral):

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Snap1099",
    short_name: "Snap1099",
    description: "Snap receipts, auto-categorize. Simple 1099 bookkeeping.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
```

- [ ] **Step 7: Final build verification**

```bash
npm run build
```

- [ ] **Step 8: Run lint**

```bash
npm run lint
```

Fix any lint errors introduced by the migration.

- [ ] **Step 9: Verify no stale imports**

```bash
rg "userFacing" --glob '*.{ts,tsx}' -l
rg "dataStreamCopy" --glob '*.{ts,tsx}' -l
rg "USER_COPY" --glob '*.{ts,tsx}' -l
```

Expected: All three return zero results.

- [ ] **Step 10: Verify translation key completeness**

```bash
node -e "
  const en = require('./messages/en.json');
  const fr = require('./messages/fr.json');
  const de = require('./messages/de.json');

  function flatKeys(obj, prefix = '') {
    return Object.entries(obj).flatMap(([k, v]) =>
      typeof v === 'object' && v !== null
        ? flatKeys(v, prefix + k + '.')
        : [prefix + k]
    );
  }

  const enKeys = flatKeys(en).sort();
  const frKeys = flatKeys(fr).sort();
  const deKeys = flatKeys(de).sort();

  const frMissing = enKeys.filter(k => !frKeys.includes(k));
  const deMissing = enKeys.filter(k => !deKeys.includes(k));

  if (frMissing.length) console.error('FR missing:', frMissing);
  if (deMissing.length) console.error('DE missing:', deMissing);
  if (!frMissing.length && !deMissing.length) console.log('All locale keys match ✓');
"
```

Expected: `All locale keys match ✓`

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(i18n): cleanup old copy files, update format.ts and INDUSTRIES

- Remove lib/copy/userFacing.ts and components/landing/dataStreamCopy.ts
- Refactor lib/legal/content.ts to remove hardcoded sections
- Add translations parameter to formatReceiptTime for Today/Yesterday
- Change INDUSTRIES to use i18n labelKey
- Update manifest.ts to use inline description"
```

---

## Verification Checklist

After all tasks are complete:

- [ ] `npm run build` passes
- [ ] `npm run lint` passes (pre-existing errors OK)
- [ ] `npm run dev` starts and serves the app
- [ ] English locale works (default, no cookie)
- [ ] French locale works (set cookie `NEXT_LOCALE=fr`)
- [ ] German locale works (set cookie `NEXT_LOCALE=de`)
- [ ] Unknown locale falls back to English (cookie `NEXT_LOCALE=ja`)
- [ ] All 3 message files have identical key structures
- [ ] No `USER_COPY` or `dataStreamCopy` imports remain
- [ ] No `getCameraErrorMessage` uses `USER_COPY` internally
