# Snap1099 Deployment Rollback Runbook

**Last Updated:** June 2026  
**Related:** [09-deployment-vercel.md](../tech/09-deployment-vercel.md) · [backup-restore.md](./backup-restore.md)

---

## 1. When to rollback

| Scenario | Rollback app? | Restore DB? |
|----------|---------------|-------------|
| Bad deploy (500 spike, auth broken) | **Yes** | Usually no |
| Bad migration corrupted data | Redeploy **after** PITR | **Yes** — see backup runbook |
| Secret leaked in deploy artifact | Rollback + rotate secrets | Case-by-case |

---

## 2. Vercel instant rollback (Production)

1. Open **Vercel Dashboard** → Snap1099 project → **Deployments**.
2. Find last **known-good** Production deployment (green, pre-incident).
3. **⋯** menu → **Promote to Production** (or **Rollback** on current).
4. Confirm — traffic shifts without rebuild.
5. Monitor **Functions** tab for 5xx (15–30 min).

**Preview:** Rollback is per-preview deployment; does not affect Production.

---

## 3. Git-based redeploy

If promote is unavailable:

```bash
git checkout <known-good-sha>
# or revert merge commit on main
git push origin main
```

Production pipeline: `prisma migrate deploy` + `next build` (see `package.json` build script). **Warning:** migrations run on deploy — ensure migration compatibility before pushing.

---

## 4. Database considerations

| Action | Guidance |
|--------|----------|
| Rollback **before** bad migration applied | App rollback only |
| Bad migration **already applied** | **Do not** only rollback app — use [backup-restore.md](./backup-restore.md) PITR |
| Forward fix | Prefer hotfix commit over rollback when migration is irreversible |

Local dev: use direct `DATABASE_URL` on `:5432`; pooler `:6543` may timeout (deployment doc §9.7).

---

## 5. Post-rollback checklist

- [ ] Homepage + Settings load
- [ ] `POST /api/ghost/register` succeeds
- [ ] Receipt upload path (or expected failure if env missing in staging)
- [ ] Paddle webhook endpoint responds (signature test)
- [ ] Update incident ticket with rolled-back deployment ID
- [ ] Schedule forward fix PR

---

## 6. Staging drill (M4 acceptance)

Quarterly: promote previous Preview deployment and verify smoke tests. Record date in incident exercise folder.

---

## 7. CI reference

From [09-deployment-vercel.md §9.8](../tech/09-deployment-vercel.md#98-ci):

- PR → Vercel Preview + Neon branch + migrate deploy  
- `main` → Production + migrate deploy
