<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Snap1099 (snaptax)

North American 1099 contractor receipt app — PWA, offline-first, Ghost → Google → Paddle.

## Product docs (read before feature work)

1. **`docs/product/PRODUCT-SPEC.md`** — canonical product rules & implementation status
2. **`docs/tech/README.md`** — full-stack tech docs (Vercel, API, DB, integrations)
3. **`docs/prd/0.0.1.md`** — full PRD
4. **`docs/product/README.md`** — doc index

## Cursor

- Rules: `.cursor/rules/snap1099-product.mdc`, `snap1099-pwa.mdc`, `snap1099-ui.mdc`, `snap1099-backend.mdc`, `snap1099-database.mdc`, `snap1099-compliance.mdc`, `snap1099-logging.mdc`, `snap1099-tax.mdc`
- Skill: `.cursor/skills/snap1099-product/SKILL.md`

## Database

- **Design spec:** `docs/tech/DB-DESIGN-SPEC.md`（改表/索引/Prisma 必读；IndexedDB store 命名 §2.2）
- DDL: `db/init-table.sql` · Schema: `prisma/schema.prisma`
- **Client stores:** `snaptax_receipts` · `snaptax_receipt_photos`（meta）· OPFS 图片 · `snaptax_system_meta` · `snaptax_crypto_meta`
- **Local images:** `docs/tech/12-local-image-storage-design.md`（压缩 1280/q75；同步 90 天后删原图留 thumb）

## Compliance

- **Spec:** `docs/superpowers/specs/2026-06-05-compliance-privacy-design.md`
- **Legal:** `docs/legal/privacy.md` · `docs/legal/terms.md`

## Observability

- **Logging spec:** `docs/superpowers/specs/2026-06-06-logging-design.md`
- **Rule:** `.cursor/rules/snap1099-logging.mdc`（API / `lib/server/*` 单行 key=value 日志）

## Tax (Est. Tax Saved)

- **Spec:** `docs/superpowers/specs/2026-06-07-tax-savings-regional-design.md`
- **Rule:** `.cursor/rules/snap1099-tax.mdc`

## MVP implementation

- **Master plan:** `docs/superpowers/plans/2026-06-07-mvp-master-implementation.md`

## Stack

Next.js 16 · React 19 · Tailwind 4 · Serwist PWA · Vercel (PostgreSQL, Blob, Serverless) · **Prisma** · OpenAI Vision · Paddle

## Key paths

- UI: `components/home/`, `components/settings/`, `components/camera/`
- Marketing: `app/(marketing)/`, `components/marketing/`
- Product PWA: `app/(pwa)/app/`, `components/pwa/`, `lib/pwa/`
- Storage: `lib/storage/receiptDb.ts`
- PWA docs: `docs/tech/13-pwa-install-architecture.md`
- PWA: `app/manifest.ts`, `app/sw.ts` (Serwist via `PwaProvider`)

## Cursor Cloud specific instructions

Single Next.js app (no monorepo). Package manager is **npm** (`package-lock.json`). Dependencies are refreshed by the startup update script (`npm install`, which runs `prisma generate` via `postinstall`).

### Local PostgreSQL (required, not auto-started)
- The app needs Postgres; there is no Docker/compose in the repo. A local cluster (`postgres`/`postgresql-contrib`) is provisioned in the VM with db `snaptax`, role `snaptax`, password `snaptax`.
- The cluster does **not** auto-start on boot. Start it before running the app or DB commands: `sudo pg_ctlcluster 16 main start` (verify with `sudo pg_lsclusters`).

### Env file (required, gitignored)
- `.env.local` holds local secrets and is intentionally **not committed**. If missing, recreate it with at least:
  - `DATABASE_URL` and `POSTGRES_URL_NON_POOLING` → `postgresql://snaptax:snaptax@localhost:5432/snaptax?schema=public`
  - `GHOST_HMAC_SECRET` and `AUTH_SECRET` → **two different** strings ≥32 chars (required to sign Ghost/session cookies; write APIs 500 without them). In production/preview they must not share the same value or cross-fallback.
- **Local dev rate limits** (optional; production defaults are Ghost 10/h, IP 60/min — see `lib/api/rateLimit.ts`):
  ```
  RECEIPT_GHOST_HOURLY=100
  RECEIPT_IP_PER_MIN=200
  ```
  Raise these when debugging upload/OCR retries; otherwise `POST /api/receipts` returns **429** `RATE_LIMITED` (not OpenAI). Stuck buckets: `DELETE FROM snaptax_rate_limit_buckets WHERE bucket_key LIKE 'ghost:receipt:%';`
- **Desktop OCR speed** (optional; Tesseract cold start on first capture can take 30–60s without preload):
  ```
  NEXT_PUBLIC_SKIP_LOCAL_OCR=1      # skip client OCR; upload → server Vision/classify only
  NEXT_PUBLIC_OCR_MAX_EDGE=960      # smaller OCR input (default 1280)
  ```
  App boot calls `preloadOcrEngine()` to warm Tesseract in a Web Worker after first load.
- Env name aliasing lives in `lib/server/env.ts` + `scripts/load-env.mjs`.
- **After `vercel env pull`:** add `DATABASE_URL` at the top of `.env.local` — pooler `:6543` often times out locally (Prisma **P1001**, `POST /api/ghost/register` **500**). Use direct `db.*.supabase.co:5432` or local Postgres; see `docs/tech/09-deployment-vercel.md` §9.7.

### Migrations
- Apply with `npm run db:migrate:deploy` (loads `.env.local`, uses a direct connection). Run after Postgres is up. `npm run db:migrate:dev` is for authoring new migrations.

### Run / lint / test
- Dev server: `npm run dev` → `http://localhost:3000`. Do not use `npm run build` for dev (it also runs migrate-deploy).
- Lint: `npm run lint`. Note: the repo currently has pre-existing lint errors (mostly React `set-state-in-effect`); a non-zero exit is not caused by env setup.
- Unit tests: `npm run test:unit` (node test runner + tsx).

### External services not configured locally
- `OPENAI_API_KEY`, `BLOB_READ_WRITE_TOKEN`, Google OAuth, and Paddle are not set in this env. Consequences:
  - Receipt **server upload** (`POST /api/receipts`) fails with `BLOB_CREDENTIALS_MISSING` (500); no AI extraction / tax amount.
  - Google login, entitlements, Paddle paywall, and Excel export require their secrets.
- Offline-first core still works without them: launching as a Ghost, capturing a receipt, and local persistence (IndexedDB) all function. Ghost register / receipt list / delete-account APIs work with just Postgres + the HMAC secret.

### Capturing a receipt in a headless/desktop browser
- There is no camera device, so tapping **SNAP RECEIPT** shows a "No camera found" overlay — use the **"Choose from gallery"** fallback to pick an image file instead.
