# Legal Contact Email Update

**Date:** 2026-07-04  
**Status:** Approved  
**Scope:** Replace public contact email only (`legal@snap1099.com` → `snaptax.lightxforge@gmail.com`)

---

## 1. Problem

Snap1099's public legal / DSR / support contact email is `legal@snap1099.com`. Operations now use `snaptax.lightxforge@gmail.com`. Product UI, legal pages, and ops docs must show the new address consistently.

---

## 2. Decisions

| Topic | Decision |
|-------|----------|
| Scope | **Option A** — public contact email only |
| Old address | `legal@snap1099.com` |
| New address | `snaptax.lightxforge@gmail.com` |
| Approach | **Single constant + full-text replace** in scoped files |
| Historical implementation plans | **Out of scope** — do not edit archived plan docs (e.g. `2026-06-11-i18n-internationalization.md`) |
| i18n centralization | **Deferred** — keep hardcoded strings; replace text only (YAGNI) |

---

## 3. Replace rules

### 3.1 In scope

- `legal@snap1099.com` → `snaptax.lightxforge@gmail.com`
- `mailto:legal@snap1099.com` → `mailto:snaptax.lightxforge@gmail.com`
- `LEGAL_CONTACT_EMAIL` constant in `lib/legal/locales.ts`

### 3.2 Out of scope

| Category | Examples | Reason |
|----------|----------|--------|
| Unit-test fixtures | `a@b.com`, `test@example.com`, `j@x.com` | Not public contact |
| Email-mask tests | `isgalloping@gmail.com` in `maskEmail.test.ts` | Unrelated sample |
| UI placeholder copy | `xxx@gmail.com` in PRD/spec examples | Describes user login display |
| User OAuth email | Google session `email` field | Dynamic per user |
| Third-party | `package-lock.json` maintainer emails | Not our contact |
| Archived plans | `docs/superpowers/plans/*.md` | Historical; not current product truth |

---

## 4. Files to change

### 4.1 Runtime code

| File | Change |
|------|--------|
| `lib/legal/locales.ts` | `LEGAL_CONTACT_EMAIL` + inline EN/FR/DE legal bundle strings |
| `lib/i18n/locales/en-US.ts` | `settings.privacyData.contact` |
| `lib/i18n/locales/fr-FR.ts` | `settings.privacyData.contact` |
| `lib/i18n/locales/de-DE.ts` | `settings.privacyData.contact` |

`lib/legal/content.ts` re-exports `LEGAL_CONTACT_EMAIL` — no edit needed.  
`components/settings/PrivacyDataSection.tsx` uses the constant — auto-updates.

### 4.2 User-facing legal pages

- `docs/legal/privacy.md`, `privacy.fr.md`, `privacy.de.md`
- `docs/legal/terms.md`, `terms.fr.md`, `terms.de.md`
- `docs/legal/security-incident.md`
- `docs/legal/data-retention.md`

### 4.3 Ops & compliance

- `docs/ops/dsr-playbook.md`
- `docs/ops/security-incident-response.md`
- `docs/ops/templates/breach-notification-email.md`
- `docs/ops/templates/dsr-ack.md`
- `docs/ops/templates/dsr-complete.md`
- `docs/ops/exercises/2026-06-30-tabletop.md`
- `docs/accessibility/WCAG-22-AA-summary.md`
- `docs/product/PRODUCT-SPEC.md`
- `docs/prd/0.0.1.update.md`
- `docs/superpowers/specs/2026-06-30-compliance-p1-legal.md`
- `docs/superpowers/specs/2026-06-30-compliance-p6-dsr-governance.md`
- `docs/superpowers/specs/2026-06-05-compliance-privacy-design.md`

---

## 5. Data flow

```
LEGAL_CONTACT_EMAIL (lib/legal/locales.ts)
    → lib/legal/content.ts
    → PrivacyDataSection mailto: link

i18n settings.privacyData.contact (hardcoded per locale)
    → Settings contact copy

docs/legal/*.md
    → /legal/* static pages
```

---

## 6. Verification

1. `rg 'legal@snap1099\.com'` — zero matches in scoped paths (excluding archived plans).
2. `npm run test:unit` — all existing tests pass (fixtures unchanged).
3. Manual: Settings → Privacy & Data → Contact row shows `snaptax.lightxforge@gmail.com` and `mailto:` opens correctly.

---

## 7. Risks

| Risk | Mitigation |
|------|------------|
| Gmail not suitable for GDPR DSR SLA | Product/ops decision; documented here per user request |
| Missed hardcoded copy | `rg legal@snap1099` before merge |
| i18n drift vs constant | Future: interpolate `{email}` from constant (out of scope) |
