# Snap1099 Security Incident Response Plan (IRP)

**Owner:** Engineering + Legal  
**Last Updated:** June 2026  
**Public summary:** [security-incident.md](../legal/security-incident.md) · `/security`  
**Contact:** snaptax.lightxforge@gmail.com · subject **Security Report**

---

## 1. Scope

Covers incidents affecting Snap1099 production: unauthorized access to receipt data, credential leaks, sub-processor breaches, availability attacks, and fraudulent Paddle webhooks.

**Out of scope:** Individual user device loss without Google sign-in (documented in Terms — not recoverable).

---

## 2. Roles

| Role | Responsibility |
|------|----------------|
| **Incident Commander (IC)** | Triage, severity, comms approval, runbook execution |
| **Engineering Lead** | Contain, rotate secrets, deploy fixes, restore data |
| **Legal / Privacy** | GDPR Art. 33/34, CPRA, user/regulator notification |
| **Comms** | Draft user email from template; no premature disclosure |

Default IC: on-call engineer until Legal designates otherwise.

---

## 3. Severity

| Level | Examples | User notification |
|-------|----------|-------------------|
| **P1** | Confirmed receipt/image leak · DB/Blob exposure · prod secret in git | **Yes** — high-risk personal data |
| **P2** | Suspected IDOR · elevated 5xx · partial log exposure (no images) | Case-by-case |
| **P3** | Failed attack · single-account abuse · non-prod leak | Usually no |

---

## 4. Phases & SLA

| Phase | Actions | SLA |
|-------|---------|-----|
| **Detect** | Vercel alerts · error spike · user report · `Security Report` email | — |
| **Triage** | Open incident doc · assign IC · severity P1–P3 · preserve logs | **4 hours** |
| **Contain** | Revoke/rotate `GHOST_HMAC_SECRET`, `AUTH_SECRET`, `OPENAI_API_KEY`, `BLOB_*`, `PADDLE_WEBHOOK_SECRET` · disable compromised webhook route if needed · tighten rate limits | P1 **24 hours** |
| **Notify** | Regulators if required (GDPR) · affected users email (template below) | **72 hours** (high-risk breach) |
| **Recover** | [backup-restore.md](./backup-restore.md) · [deployment-rollback.md](./deployment-rollback.md) | RTO **4h** target (P1) |
| **Post-mortem** | Internal RCA · update SECURITY-BASELINE · matrix/action items | **7 days** |

---

## 5. Detection sources

| Source | Signal |
|--------|--------|
| Vercel | 5xx rate · function errors · deployment failures |
| Application logs | `withRequestLog` · `requestId` · auth failures spike |
| User / legal@ | Security Report subject |
| Paddle / OpenAI | Provider status pages · webhook signature failures |
| Git / env | Secret scan · accidental commit |

**Log retention:** 90 days (Vercel platform). See [logging-design](../superpowers/specs/2026-06-06-logging-design.md).

**Never log:** receipt image bytes · raw Google tokens · full Paddle payloads · passwords.

---

## 6. Containment checklist (P1)

- [ ] Identify blast radius (Ghost vs Google users · date range · receipt IDs)
- [ ] Rotate affected secrets in Vercel Production (not Preview-only)
- [ ] Invalidate Ghost sessions if `GHOST_HMAC_SECRET` rotated (users re-register Ghost)
- [ ] Review Blob signed URL abuse · Postgres `receiptWhereForActor` audit
- [ ] Block abusive IPs / ghost buckets if applicable
- [ ] Preserve logs and deploy IDs before rollback

---

## 7. Notification

| Audience | When | Template |
|----------|------|----------|
| Users (high-risk) | ≤72h of awareness | [breach-notification-email.md](./templates/breach-notification-email.md) |
| Supervisory authority | GDPR Art. 33 where required | Legal counsel |
| Sub-processors | Contractual | OpenAI / Vercel / Paddle account teams |

Public page already states 72h commitment: [security-incident.md](../legal/security-incident.md).

---

## 8. DSR overlap

Privacy requests during an incident → [dsr-playbook.md](./dsr-playbook.md). Do not delay legally required erasure because of investigation; coordinate with Legal.

---

## 9. Related runbooks

| Doc | Purpose |
|-----|---------|
| [backup-restore.md](./backup-restore.md) | Postgres PITR · Blob recovery |
| [deployment-rollback.md](./deployment-rollback.md) | Vercel promote previous deploy |
| [SECURITY-BASELINE.md](../tech/SECURITY-BASELINE.md) | Control matrix |
| [dsr-playbook.md](./dsr-playbook.md) | Privacy requests |

---

## 10. Exercise record

Latest tabletop: [exercises/2026-06-30-tabletop.md](./exercises/2026-06-30-tabletop.md)
