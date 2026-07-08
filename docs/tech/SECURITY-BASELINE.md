# Snap1099 Security Baseline

**Last Updated:** June 2026  
**Audience:** Engineering · Security review · Compliance audit  
**Public summary:** [Security & Incident Response](/security) (Privacy §10) · [Privacy Policy §6](/privacy)

This document maps **Security by Default** controls to implementation. It must stay aligned with `docs/legal/privacy.md` — do not disclose capabilities here that Privacy does not promise.

---

## 1. Controls matrix

| Control | Implementation | Disclosure |
|---------|----------------|------------|
| **TLS 1.3 (in transit)** | Vercel HTTPS for App and API | Privacy §6 |
| **AES-256 at rest (cloud)** | Neon Postgres · Vercel Blob (provider-managed) | Privacy §6 |
| **Local image encryption** | AES-GCM-256 via Web Crypto · `lib/storage/crypto/aesGcm.ts` · OPFS in `photoStore.ts` | Privacy §1 · Settings Data storage |
| **Ghost authentication** | HMAC-signed HttpOnly cookie · `GHOST_HMAC_SECRET` · no bare client UUID | [api-security ADR](../superpowers/specs/2026-06-05-api-security-design.md) |
| **Google OAuth** | `profile` + `email` scopes only | Privacy §3 |
| **Paddle webhook integrity** | HMAC signature verify · `lib/server/paddleWebhook.ts` · `app/api/webhooks/paddle/route.ts` | Privacy §5 |
| **Receipt ownership (IDOR)** | `receiptWhereForActor()` · `assertReceiptAccess()` · `lib/receipts/ownership.ts` | api-security ADR |
| **Private Blob storage** | No public list; server-only upload | api-security ADR · PRODUCT-SPEC §2.5 |
| **Signed image URLs** | `GET /api/receipts/:id/image` · TTL **15 min** (`SIGNED_URL_TTL_MS`) | [12-local-image-storage-design.md](./12-local-image-storage-design.md) |
| **Rate limiting** | Ghost hourly · IP per-minute · DB buckets · `lib/api/dbRateLimit.ts` · `lib/api/rateLimit.ts` | logging-design · AGENTS.md |
| **Log redaction** | Single-line key=value; email mask; no image bytes | [logging-design](../superpowers/specs/2026-06-06-logging-design.md) |
| **CSP & security headers** | `lib/security/headers.ts` · applied via `proxy.ts` | Internal (this doc) |
| **OpenAI server-only** | API key in server env only; client sends images to our API, not OpenAI directly | Privacy §4 · PRODUCT-SPEC §2.5 |
| **Upload limits** | JPEG/PNG · ≤5MB · server validation on `POST /api/receipts` | api-security ADR |

---

## 2. Least privilege

| Layer | Principle | Notes |
|-------|-----------|-------|
| **Vercel env** | Production secrets only in Production; Preview uses isolated values | `AUTH_SECRET` ≠ `GHOST_HMAC_SECRET` in prod |
| **Database** | App role without SUPERUSER; migrations via deploy role | `db/init-table.sql` · Prisma migrate |
| **Blob** | RW token scoped to project; no public container listing | `BLOB_READ_WRITE_TOKEN` server-only |
| **OpenAI** | Server-only key; never in client bundle or logs | `OPENAI_API_KEY` |
| **Paddle** | Webhook secret server-only; client uses Paddle.js public token | `PADDLE_WEBHOOK_SECRET` |

---

## 3. Authentication flows

| Actor | Mechanism | Write access |
|-------|-----------|--------------|
| Ghost | HMAC cookie from `POST /api/ghost/register` | Receipts scoped to `ghost_id` |
| Google user | Session cookie after OAuth | Receipts scoped to `user_id`; Ghost data migrated on bind |
| Webhook (Paddle) | Signature header | Entitlements only |

---

## 4. Data retention cross-reference

Local and server retention periods are documented for users in [data-retention.md](../legal/data-retention.md) (`/data-retention`). Code-to-constant alignment for audits is in [data-retention-code-alignment.md](../ops/data-retention-code-alignment.md). Enforcement:

- `lib/client/receiptRetention.ts` — 18-month IndexedDB prune  
- `lib/client/photoRetention.ts` — 90-day OPFS full-image purge  
- `lib/api/dbRateLimit.ts` — 24h rate-limit bucket GC  

---

## 5. Incident response

Public commitment: [security-incident.md](../legal/security-incident.md) (72h high-risk breach notification where required).

Internal IRP and runbooks: [docs/ops/security-incident-response.md](../ops/security-incident-response.md) · [docs/ops/README.md](../ops/README.md).

---

## 6. Verification checklist

- [ ] Paddle webhook signature tests pass (`lib/server/paddleWebhook.test.ts`)
- [ ] Security headers test pass (`lib/security/headers.test.ts`)
- [ ] Receipt API returns **404** (not 403) for other users' IDs
- [ ] No `OPENAI_API_KEY` / `GHOST_HMAC_SECRET` in client bundles or git
- [ ] Privacy §6 claims match this matrix (no over-promise)

---

## Related documents

| Document | Purpose |
|----------|---------|
| [2026-06-05-api-security-design.md](../superpowers/specs/2026-06-05-api-security-design.md) | Ghost HMAC · OpenAI · IDOR · rate limits |
| [2026-06-06-logging-design.md](../superpowers/specs/2026-06-06-logging-design.md) | Log format and redaction |
| [compliance-program-design.md](../superpowers/topics/compliance-program-design.md) | Compliance program (P3) |
| [data-retention.md](../legal/data-retention.md) | Public retention periods (`/data-retention`) |
| [data-retention-code-alignment.md](../ops/data-retention-code-alignment.md) | Internal code constant audit |
