# Remove Home Google Banner — Design

**Date:** 2026-06-07  
**Status:** Implemented  
**Approach:** A2 — Remove home login UI; voluntary sign-in in Settings Account; keep hard intercepts in Settings

---

## 1. Goal

Remove the home-screen Google soft banner to reduce friction on first snap. Voluntary login lives in **Settings → Account**. Hard intercept sheets for Export and Multi-device remain in Settings.

---

## 2. Home screen

**Removed:** `GoogleSoftBanner`, home `GoogleSignInSheet`, `showSoftBanner` logic, `softBannerDismissed` state.

**Unchanged:** TaxHeader, SnapButton, ReceiptList, ComplianceFootnote.

---

## 3. Settings

**Account (unsigned):** Warning + backup hint + `Continue with Google` → soft sheet.

**Hard intercepts (unchanged):** Export → `hard-export`; View on All Devices → `hard-sync`.

---

## 4. Cleanup

- Deleted `components/home/GoogleSoftBanner.tsx`
- Removed `isSoftBannerDismissed` / `dismissSoftBannerForever` from `authStorage`
- Removed `softBannerDismissed` / `dismissSoftBanner` from `useAuthSession`

---

## 5. Verification

- Home: no Google banner or sign-in sheet
- Settings → Account → Continue with Google works
- Settings → Export / Multi-device hard sheets when unsigned
- `npm run build` passes
