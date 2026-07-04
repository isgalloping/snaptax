# Snap1099 Backup & Restore Runbook

**Last Updated:** June 2026  
**Related:** [security-incident-response.md](./security-incident-response.md) · [09-deployment-vercel.md](../tech/09-deployment-vercel.md)

---

## 1. Targets (MVP documented)

| Metric | Target | Notes |
|--------|--------|-------|
| **RPO** (max data loss) | **24 hours** | Neon PITR / daily snapshot granularity |
| **RTO** (restore to service) | **4 hours** (P1) | Depends on incident scope |

---

## 2. PostgreSQL (Neon via Vercel)

**Production:** Vercel Storage → Postgres (Neon-managed, US region).

| Capability | Use |
|------------|-----|
| **Point-in-time restore (PITR)** | Restore to timestamp before bad migration or data corruption |
| **Branch** | Preview / dev isolation (see deployment doc §9.8) |

### Restore procedure (P1)

1. **Stop writes** — enable maintenance mode or deploy read-only flag if available; at minimum pause destructive migrations.
2. **Neon console** (via Vercel Storage or Neon dashboard) → select production project → **Restore** / **PITR** to known-good timestamp.
3. **Verify connection strings** — `DATABASE_URL` / `POSTGRES_URL_NON_POOLING` still valid after restore.
4. **Run smoke tests** — Ghost register · receipt list · single receipt fetch.
5. **Document** incident ticket with restore timestamp and data loss window.

### Schema migrations

- Forward-only migrations: `npm run db:migrate:deploy` on deploy.
- **Bad migration:** restore PITR **then** fix migration locally before redeploy — do not re-run broken migration on restored DB.

---

## 3. Vercel Blob (receipt images)

| Item | Detail |
|------|--------|
| Storage | Private containers; server upload only |
| Token | `BLOB_READ_WRITE_TOKEN` — rotate on compromise |

**Restore / integrity:**

1. If Blob token leaked: rotate token in Vercel → redeploy.
2. If objects deleted maliciously: contact Vercel support for recovery options (provider-dependent versioning/soft-delete).
3. Cross-check Postgres `image_url` / blob keys against accessible objects after restore.

Users may retain local OPFS copies until 90-day purge; cloud is authoritative for signed-in sync.

---

## 4. Client data (IndexedDB / OPFS)

Not centrally backed up. **Delete Account** and device loss are user-controlled per [data-retention.md](../legal/data-retention.md).

Support: advise Google sign-in + cloud sync for multi-device recovery.

---

## 5. Secrets backup

| Secret | Source of truth |
|--------|-----------------|
| Vercel env vars | Vercel Project → Settings → Environment Variables (history on rotate) |
| Local dev | `.env.local` (gitignored — team password manager) |

After rotation, update: Production + Preview as needed; never share secrets in Slack/email.

---

## 6. Post-restore validation

- [ ] Ghost HMAC register + receipt upload
- [ ] Google session receipt list
- [ ] Signed image URL `GET /api/receipts/:id/image`
- [ ] Paddle webhook test transaction (staging)
- [ ] No elevated 5xx in Vercel dashboard (15 min)

---

## 7. Related

- [deployment-rollback.md](./deployment-rollback.md) — app layer rollback
- [SECURITY-BASELINE.md](../tech/SECURITY-BASELINE.md)
