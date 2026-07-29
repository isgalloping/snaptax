# Snap1099 Compliance Program — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Option C — 12-dimension compliance coverage via milestones M0–M4 (Legal, Data/Security, WCAG 2.2 AA, Security Ops).

**Architecture:** Master matrix tracks status; each milestone ships independently testable artifacts. Legal truth: `docs/legal/*.md` (canonical long-form) + `lib/legal/locales.ts` (App Sheet + `/privacy` `/terms` rendered sections must stay in sync).

**Tech Stack:** Next.js 16 · markdown legal docs · i18n locales · axe-core (M3) · internal ops markdown

**Specs:** [`2026-06-30-compliance-master-matrix.md`](../specs/2026-06-30-compliance-master-matrix.md) · P1–P6 sub-specs

---

## File map (program)

| Milestone | Create / modify |
|-----------|-----------------|
| M0 | `docs/prd/0.0.1.update.md`, matrix status |
| M1 | `docs/legal/privacy.{md,fr,de}.md`, `terms.*`, `lib/legal/locales.ts`, `PrivacyDataSection`, optional `app/data-retention/page.tsx` |
| M2 | `docs/legal/data-retention.md` (expand), `docs/tech/SECURITY-BASELINE.md`, PRODUCT-SPEC §2.3 |
| M3 | `docs/accessibility/WCAG-22-AA-summary.md`, component a11y fixes |
| M4 | `docs/ops/*.md`, `docs/legal/security-incident.md` (done stub), matrix row 12 |

---

## Milestone M0 — Matrix freeze & conflict cleanup

### Task M0-1: Deprecate Frankfurt conflict

**Files:**
- Modify: `docs/prd/0.0.1.update.md` (EU Frankfurt §)
- Modify: `docs/superpowers/specs/2026-06-30-compliance-master-matrix.md` (Status → In progress)

- [ ] **Step 1:** At top of `0.0.1.update.md` Privacy excerpt, add banner:

```markdown
> **DEPRECATED (2026-06-30):** EU Frankfurt hosting claims superseded by PRODUCT-SPEC v1.2 and `docs/legal/privacy.md` §6 (U.S. storage + DPF/SCC). Do not implement Frankfurt routing from this doc.
```

- [ ] **Step 2:** Commit

```bash
git add docs/prd/0.0.1.update.md docs/superpowers/specs/2026-06-30-compliance-master-matrix.md
git commit -m "docs: deprecate Frankfurt hosting claims in prd update"
```

---

## Milestone M1 — Legal & DSR (P1 + P6)

### Task M1-1: Expand English Privacy (`docs/legal/privacy.md`)

**Files:**
- Modify: `docs/legal/privacy.md`

- [ ] **Step 1:** Restructure to P1 §2 outline (12 sections): ownership, categories table, AI, SCC+DPF, retention link, CPRA Do Not Sell, full GDPR rights + **30-day response**, security/incident link, children, changes.

- [ ] **Step 2:** Add explicit lines:

```markdown
**We do not sell your personal information.**

Standard Contractual Clauses (SCCs) supplement transfers where the EU-U.S. Data Privacy Framework does not apply.
```

- [ ] **Step 3:** Link `/data-retention` and `/security` (or relative paths once routes exist).

- [ ] **Step 4:** Commit

```bash
git commit -m "legal: expand privacy policy for GDPR CPRA SCC AI retention"
```

### Task M1-2: Expand English Terms (`docs/legal/terms.md`)

**Files:**
- Modify: `docs/legal/terms.md`

- [ ] **Step 1:** Expand to 12 sections per P1 §3 (IP, liability cap, termination, governing law, Est. Tax Saved disclaimer).

- [ ] **Step 2:** Commit

```bash
git commit -m "legal: expand terms of service chapters"
```

### Task M1-3: Mirror fr/de legal markdown

**Files:**
- Modify: `docs/legal/privacy.fr.md`, `privacy.de.md`, `terms.fr.md`, `terms.de.md`

- [ ] **Step 1:** Match EN section structure; translate new sections.

- [ ] **Step 2:** Commit

```bash
git commit -m "legal: sync fr/de privacy and terms with expanded structure"
```

### Task M1-4: Sync `lib/legal/locales.ts` (Sheet + public pages)

**Files:**
- Modify: `lib/legal/locales.ts`

**Note:** `LegalPageContent` renders `getLegalSections()` — **not** raw markdown. Sheet and `/privacy` must match new Privacy/Terms summaries.

- [ ] **Step 1:** Add EN privacy sections: `Data Ownership`, `AI Processing`, `CPRA Categories`, `Retention & Security` (abbreviated bullets).

- [ ] **Step 2:** Update `Your Rights` → 30-day response + all six GDPR rights listed.

- [ ] **Step 3:** Expand EN terms sections to mirror 12-part structure (abbreviated for Sheet).

- [ ] **Step 4:** Mirror FR + DE bundles.

- [ ] **Step 5:** Update `lastUpdatedLabel` if needed.

- [ ] **Step 6:** Manual: open Settings → Privacy Sheet + `/privacy` — section count matches.

- [ ] **Step 7:** Commit

```bash
git commit -m "legal: sync locales.ts summaries with expanded privacy and terms"
```

### Task M1-5: Public routes for retention & security incident

**Files:**
- Create: `app/data-retention/page.tsx`
- Create: `app/security/page.tsx` (or `app/security-incident/page.tsx`)
- Modify: `components/settings/PrivacyDataSection.tsx` — optional rows linking to new pages

- [ ] **Step 1:** Add pages mirroring `app/privacy/page.tsx` pattern — render markdown body or reuse a small `LegalMarkdownPage` if added.

Simplest MVP: static page component importing rendered sections from new helper reading `docs/legal/data-retention.md` — **or** duplicate structured sections in locales for consistency with existing pattern.

**Recommended:** Add `LegalStaticDoc` type in `lib/legal/content.ts`:

```typescript
export type LegalStaticDoc = "data-retention" | "security-incident";
```

Render markdown from `docs/legal/` via `fs.readFileSync` in Server Component (like export legal full text footnote already references paths).

- [ ] **Step 2:** Add Settings links: "Data Retention" → `/data-retention`, "Security" → `/security`.

- [ ] **Step 3:** Commit

```bash
git commit -m "feat: add data retention and security incident public pages"
```

### Task M1-6: Export/Paywall disclaimer line (non-modal)

**Files:**
- Modify: `components/settings/TaxExportCard.tsx` or `PaywallSheet.tsx` (one line + link)

- [ ] **Step 1:** Add zinc-400 text: `Est. Tax Saved is an estimate, not tax advice. See Terms §6.`

- [ ] **Step 2:** i18n keys in `messages/*.json` if user-facing strings require locale.

- [ ] **Step 3:** Commit

```bash
git commit -m "ui: add tax estimate disclaimer on export path"
```

### Task M1-7: DSR internal playbook (P6)

**Files:**
- Create: `docs/ops/dsr-playbook.md`
- Create: `docs/ops/templates/dsr-ack.md`, `dsr-complete.md`

- [ ] **Step 1:** Document request types, 30-day SLA, ack within 48h, identity verification.

- [ ] **Step 2:** Commit (ops docs only)

```bash
git commit -m "docs: add DSR playbook and email templates"
```

### Task M1-8: Update PRODUCT-SPEC §2.3 checklist

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md`

- [ ] **Step 1:** Extend implementation status table for new Privacy § numbers, retention/security routes, 30-day DSR.

- [ ] **Step 2:** Commit

```bash
git commit -m "docs: update PRODUCT-SPEC compliance implementation status"
```

**M1 exit:** Matrix rows 1,3,4,5,6,7,8,9 → Implemented (legal); row 3 partial until DSR drill in M4 optional.

---

## Milestone M2 — Data & Security (P2 + P3)

### Task M2-1: Retention doc ↔ code audit

**Files:**
- Modify: `docs/legal/data-retention.md`
- Modify: `lib/client/receiptRetention.ts`, `lib/client/photoRetention.ts` — **only if constants drift**

- [ ] **Step 1:** Grep `RECEIPT_RETENTION`, `PHOTO_FULL_RETENTION`, `GC_RETENTION` — document exact values in retention.md.

- [ ] **Step 2:** Add fr/de retention pages OR note EN-only for M2 (decision: EN canonical + Privacy links EN path OK for MVP).

- [ ] **Step 3:** Commit

```bash
git commit -m "docs: align data retention policy with code constants"
```

### Task M2-2: Security Baseline doc

**Files:**
- Create: `docs/tech/SECURITY-BASELINE.md`
- Modify: `docs/tech/README.md` — index link

- [ ] **Step 1:** Write controls matrix from P3 spec with file pointers.

- [ ] **Step 2:** Privacy §10 cross-link.

- [ ] **Step 3:** Commit

```bash
git commit -m "docs: add SECURITY-BASELINE control matrix"
```

**M2 exit:** Matrix rows 2, 10 → Implemented.

---

## Milestone M3 — Accessibility WCAG 2.2 AA (P4)

### Task M3-1: Baseline axe audit

**Files:**
- Create: `docs/accessibility/WCAG-22-AA-audit-YYYY-MM-DD.md`
- Dev dependency: `@axe-core/cli` (optional script in package.json)

- [ ] **Step 1:** Run axe on `/`, `/settings` flow (manual navigation), document critical/serious issues per core path.

- [ ] **Step 2:** Commit audit log (issues only, no fixes yet)

```bash
git commit -m "docs: WCAG 2.2 AA baseline audit findings"
```

### Task M3-2: P0 fixes — keyboard & focus

**Files:** (from audit — typical)
- Modify: `components/home/SnapButton.tsx`, `ReceiptList.tsx`, `LegalSheet.tsx`, `ReceiptDetailSheet.tsx`

- [ ] **Step 1:** Fix P0: focus trap escape, visible focus, button labels.

- [ ] **Step 2:** Re-run axe — 0 critical on core paths.

- [ ] **Step 3:** Commit per wave

### Task M3-3: VPAT-lite summary

**Files:**
- Create: `docs/accessibility/WCAG-22-AA-summary.md`

- [ ] **Step 1:** One-page conformance summary + known gaps.

- [ ] **Step 2:** Commit

```bash
git commit -m "docs: WCAG 2.2 AA conformance summary"
```

**M3 exit:** Matrix row 11 → Implemented.

---

## Milestone M4 — Security Operations (P5)

### Task M4-1: IRP & runbooks

**Files:**
- Create: `docs/ops/security-incident-response.md`
- Create: `docs/ops/backup-restore.md`
- Create: `docs/ops/deployment-rollback.md`
- Create: `docs/ops/templates/breach-notification-email.md`

- [ ] **Step 1:** Write IRP phases + roles from P5 spec.

- [ ] **Step 2:** Link Neon PITR + Vercel rollback from `09-deployment-vercel.md`.

- [ ] **Step 3:** Commit

```bash
git commit -m "docs: add security incident IRP and ops runbooks"
```

### Task M4-2: Tabletop exercise record

**Files:**
- Create: `docs/ops/exercises/2026-06-30-tabletop.md`

- [ ] **Step 1:** Document simulated breach scenario + 72h notification draft.

- [ ] **Step 2:** Commit

```bash
git commit -m "docs: record security incident tabletop exercise"
```

### Task M4-3: Close master matrix

**Files:**
- Modify: `docs/superpowers/specs/2026-06-30-compliance-master-matrix.md`

- [ ] **Step 1:** Set all 12 rows to **Implemented** with commit refs.

- [ ] **Step 2:** Commit

```bash
git commit -m "docs: mark compliance master matrix complete"
```

**M4 exit:** Matrix row 12 → Implemented; program complete.

**Program status:** ✅ **Complete** (2026-06-30 · branch `0.4.2`) — see [`2026-06-30-compliance-master-matrix.md`](../specs/2026-06-30-compliance-master-matrix.md) §6.

---

## Execution order (recommended waves)

| Wave | Tasks | Duration est. |
|------|-------|---------------|
| **W0** | M0-1 | 0.5d |
| **W1** | M1-1 … M1-4 | 3–4d |
| **W2** | M1-5 … M1-8 | 2d |
| **W3** | M2-1 … M2-2 | 1–2d |
| **W4** | M3-1 … M3-3 | 4–6d |
| **W5** | M4-1 … M4-3 | 2d |

---

## Spec coverage checklist

| Matrix # | Milestone tasks |
|----------|-----------------|
| 1–9 | M1 |
| 10 | M2 |
| 11 | M3 |
| 12 | M4 |

---

## Out of scope (defer)

- EU Frankfurt infrastructure
- SOC2 audit
- Full markdown renderer for all legal pages (optional refactor post-M1)
