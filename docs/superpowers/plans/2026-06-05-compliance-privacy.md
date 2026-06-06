# Compliance & Privacy Implementation Plan

> **For agentic workers:** Use executing-plans task-by-task. Spec: `docs/superpowers/specs/2026-06-05-compliance-privacy-design.md`

**Goal:** EU/US GDPR+CPRA compliance UI (U2), legal docs, PRD/PRODUCT sync; P0 without backend region routing.

**Architecture:** `docs/legal/` canonical → `lib/legal/content.ts` → `/privacy` `/terms` + Bottom Sheet; login前仅 IndexedDB（文档+UI 先行）。

---

### Task 1: Legal docs + content module

- Create `docs/legal/privacy.md`, `docs/legal/terms.md`
- Create `lib/legal/content.ts` (sections for Sheet/pages)

### Task 2: Legal UI components

- `components/legal/LegalSheet.tsx`
- `components/legal/ComplianceFootnote.tsx`
- Wire into `SnapButton.tsx`

### Task 3: Settings Privacy & Data

- `components/settings/PrivacyDataSection.tsx` + Delete confirm Sheet
- `lib/storage/clearLocalData.ts`
- Update `SettingsScreen.tsx`

### Task 4: Public routes

- `app/privacy/page.tsx`, `app/terms/page.tsx`

### Task 5: Docs + rules + ui.html

- PRD §2.5, PRODUCT-SPEC §2.4 compliance, rules, `docs/ui/ui.html`
