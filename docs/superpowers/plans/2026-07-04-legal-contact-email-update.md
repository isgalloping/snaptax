# Legal Contact Email Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all public contact email occurrences of `legal@snap1099.com` with `snaptax.lightxforge@gmail.com` across runtime code and active product/legal/ops docs.

**Architecture:** Single constant `LEGAL_CONTACT_EMAIL` in `lib/legal/locales.ts` remains the runtime source of truth; i18n locale strings and markdown docs get a mechanical find-replace. No i18n interpolation refactor (deferred per spec).

**Tech Stack:** TypeScript (Next.js 16), i18n locale files, Markdown docs

**Spec:** `docs/superpowers/specs/2026-07-04-legal-contact-email-update-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/legal/locales.ts` | `LEGAL_CONTACT_EMAIL` + inline legal sheet copy (EN/FR/DE) |
| `lib/i18n/locales/en-US.ts` | Settings privacy contact string (EN) |
| `lib/i18n/locales/fr-FR.ts` | Settings privacy contact string (FR) |
| `lib/i18n/locales/de-DE.ts` | Settings privacy contact string (DE) |
| `docs/legal/*.md` | Public legal pages (privacy, terms, security, retention) |
| `docs/ops/**` | DSR playbook, incident response, email templates |
| `docs/product/PRODUCT-SPEC.md` | Product canonical rules |
| `docs/prd/0.0.1.update.md` | PRD contact reference |
| `docs/accessibility/WCAG-22-AA-summary.md` | Accessibility feedback contact |
| `docs/superpowers/specs/2026-06-*-compliance-*.md` | Active compliance specs (3 files) |

**Do not modify:** `docs/superpowers/plans/*.md`, test fixtures, `package-lock.json`

**Branch:** `cursor/legal-contact-email-b9a9` off `main`

**Replace string:**
- Old: `legal@snap1099.com`
- New: `snaptax.lightxforge@gmail.com`

---

### Task 1: Runtime constant and legal bundles

**Files:**
- Modify: `lib/legal/locales.ts`
- Test: `lib/legal/locales.test.ts` (create)

- [ ] **Step 1: Write failing test**

Create `lib/legal/locales.test.ts`:

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LEGAL_CONTACT_EMAIL } from "./locales.ts";

describe("LEGAL_CONTACT_EMAIL", () => {
  it("is the public Gmail contact address", () => {
    assert.equal(LEGAL_CONTACT_EMAIL, "snaptax.lightxforge@gmail.com");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --import tsx --test lib/legal/locales.test.ts
```

Expected: FAIL — received `"legal@snap1099.com"`

- [ ] **Step 3: Update `lib/legal/locales.ts`**

Change line 21:

```typescript
export const LEGAL_CONTACT_EMAIL = "snaptax.lightxforge@gmail.com";
```

Replace all 6 inline occurrences in the same file (EN/FR/DE privacy + terms sections):

```bash
# From repo root — scoped to this file only
sed -i 's/legal@snap1099\.com/snaptax.lightxforge@gmail.com/g' lib/legal/locales.ts
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --import tsx --test lib/legal/locales.test.ts
```

Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add lib/legal/locales.ts lib/legal/locales.test.ts
git commit -m "chore(legal): update LEGAL_CONTACT_EMAIL to snaptax.lightxforge@gmail.com"
```

---

### Task 2: i18n locale strings

**Files:**
- Modify: `lib/i18n/locales/en-US.ts:668`
- Modify: `lib/i18n/locales/fr-FR.ts:680`
- Modify: `lib/i18n/locales/de-DE.ts:679`

- [ ] **Step 1: Replace contact strings**

`en-US.ts`:

```typescript
      contact: "Need more help? snaptax.lightxforge@gmail.com",
```

`fr-FR.ts`:

```typescript
    contact: "Besoin d'aide ? snaptax.lightxforge@gmail.com",
```

`de-DE.ts`:

```typescript
    contact: "Weitere Fragen? snaptax.lightxforge@gmail.com",
```

- [ ] **Step 2: Verify no old email in i18n**

```bash
rg 'legal@snap1099\.com' lib/i18n/
```

Expected: no matches

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/locales/en-US.ts lib/i18n/locales/fr-FR.ts lib/i18n/locales/de-DE.ts
git commit -m "chore(i18n): update settings contact email"
```

---

### Task 3: Public legal markdown pages

**Files:**
- Modify: `docs/legal/privacy.md`
- Modify: `docs/legal/privacy.fr.md`
- Modify: `docs/legal/privacy.de.md`
- Modify: `docs/legal/terms.md`
- Modify: `docs/legal/terms.fr.md`
- Modify: `docs/legal/terms.de.md`
- Modify: `docs/legal/security-incident.md`
- Modify: `docs/legal/data-retention.md`

- [ ] **Step 1: Bulk replace in legal docs**

```bash
for f in docs/legal/privacy.md docs/legal/privacy.fr.md docs/legal/privacy.de.md \
         docs/legal/terms.md docs/legal/terms.fr.md docs/legal/terms.de.md \
         docs/legal/security-incident.md docs/legal/data-retention.md; do
  sed -i 's/legal@snap1099\.com/snaptax.lightxforge@gmail.com/g' "$f"
done
```

- [ ] **Step 2: Verify**

```bash
rg 'legal@snap1099\.com' docs/legal/
```

Expected: no matches

- [ ] **Step 3: Commit**

```bash
git add docs/legal/
git commit -m "docs(legal): update contact email in public legal pages"
```

---

### Task 4: Ops, product, and compliance docs

**Files:**
- Modify: `docs/ops/dsr-playbook.md`
- Modify: `docs/ops/security-incident-response.md`
- Modify: `docs/ops/templates/breach-notification-email.md`
- Modify: `docs/ops/templates/dsr-ack.md`
- Modify: `docs/ops/templates/dsr-complete.md`
- Modify: `docs/ops/exercises/2026-06-30-tabletop.md`
- Modify: `docs/accessibility/WCAG-22-AA-summary.md`
- Modify: `docs/product/PRODUCT-SPEC.md`
- Modify: `docs/prd/0.0.1.update.md`
- Modify: `docs/superpowers/specs/2026-06-30-compliance-p1-legal.md`
- Modify: `docs/superpowers/specs/2026-06-30-compliance-p6-dsr-governance.md`
- Modify: `docs/superpowers/specs/2026-06-05-compliance-privacy-design.md`

- [ ] **Step 1: Bulk replace**

```bash
for f in \
  docs/ops/dsr-playbook.md \
  docs/ops/security-incident-response.md \
  docs/ops/templates/breach-notification-email.md \
  docs/ops/templates/dsr-ack.md \
  docs/ops/templates/dsr-complete.md \
  docs/ops/exercises/2026-06-30-tabletop.md \
  docs/accessibility/WCAG-22-AA-summary.md \
  docs/product/PRODUCT-SPEC.md \
  docs/prd/0.0.1.update.md \
  docs/superpowers/specs/2026-06-30-compliance-p1-legal.md \
  docs/superpowers/specs/2026-06-30-compliance-p6-dsr-governance.md \
  docs/superpowers/specs/2026-06-05-compliance-privacy-design.md; do
  sed -i 's/legal@snap1099\.com/snaptax.lightxforge@gmail.com/g' "$f"
done
```

For `2026-06-30-compliance-p6-dsr-governance.md`, the table row becomes:

```markdown
| **snaptax.lightxforge@gmail.com** | 主渠道 |
```

- [ ] **Step 2: Verify scoped paths clean**

```bash
rg 'legal@snap1099\.com' \
  lib/ components/ docs/legal/ docs/ops/ docs/product/ \
  docs/prd/ docs/accessibility/ \
  docs/superpowers/specs/2026-06-30-compliance-p1-legal.md \
  docs/superpowers/specs/2026-06-30-compliance-p6-dsr-governance.md \
  docs/superpowers/specs/2026-06-05-compliance-privacy-design.md
```

Expected: no matches

Remaining `legal@snap1099.com` in `docs/superpowers/plans/` and the new design spec (which documents the old address) are acceptable.

- [ ] **Step 3: Commit**

```bash
git add docs/ops/ docs/accessibility/ docs/product/ docs/prd/ \
  docs/superpowers/specs/2026-06-30-compliance-p1-legal.md \
  docs/superpowers/specs/2026-06-30-compliance-p6-dsr-governance.md \
  docs/superpowers/specs/2026-06-05-compliance-privacy-design.md
git commit -m "docs: update legal contact email across ops and compliance docs"
```

---

### Task 5: Full verification, push, PR

**Files:** none (verification only)

- [ ] **Step 1: Run unit tests**

```bash
npm run test:unit
```

Expected: no new failures (pre-existing lint/test failures unrelated to this change are OK)

- [ ] **Step 2: Repo-wide grep sanity check**

```bash
rg 'legal@snap1099\.com' --glob '!docs/superpowers/plans/**' --glob '!docs/superpowers/specs/2026-07-04-legal-contact-email-update-design.md'
```

Expected: zero matches outside archived plans and the design spec (which intentionally references the old address)

- [ ] **Step 3: Push and open PR**

```bash
git push -u origin cursor/legal-contact-email-b9a9
```

PR title: `chore: update public contact email to snaptax.lightxforge@gmail.com`

PR body summary:
- Replaces `legal@snap1099.com` → `snaptax.lightxforge@gmail.com`
- Runtime: `LEGAL_CONTACT_EMAIL`, i18n contact strings
- Docs: legal pages, ops templates, PRODUCT-SPEC, compliance specs
- Adds `lib/legal/locales.test.ts` guard

- [ ] **Step 4: Manual smoke (optional)**

Dev server → Settings → Privacy & Data → Contact row shows `snaptax.lightxforge@gmail.com`; tap opens `mailto:snaptax.lightxforge@gmail.com`.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Update `LEGAL_CONTACT_EMAIL` constant | Task 1 |
| Update i18n EN/FR/DE contact | Task 2 |
| Update `docs/legal/*.md` | Task 3 |
| Update ops templates & playbooks | Task 4 |
| Update PRODUCT-SPEC, PRD, compliance specs | Task 4 |
| Skip test fixtures | All tasks (no test fixture files touched) |
| Skip archived plans | All tasks (explicit exclude) |
| `rg` verification | Task 5 |
| `npm run test:unit` | Task 5 |
