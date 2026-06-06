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

- Rules: `.cursor/rules/snap1099-product.mdc`, `snap1099-ui.mdc`, `snap1099-backend.mdc`, `snap1099-database.mdc`, `snap1099-compliance.mdc`
- Skill: `.cursor/skills/snap1099-product/SKILL.md`

## Database

- **Design spec:** `docs/tech/DB-DESIGN-SPEC.md`（改表/索引/Prisma 必读）
- DDL: `db/init-table.sql` · Schema: `prisma/schema.prisma`

## Compliance

- **Spec:** `docs/superpowers/specs/2026-06-05-compliance-privacy-design.md`
- **Legal:** `docs/legal/privacy.md` · `docs/legal/terms.md`

## Stack

Next.js 16 · React 19 · Tailwind 4 · Serwist PWA · Vercel (PostgreSQL, Blob, Serverless) · **Prisma** · OpenAI Vision · Paddle

## Key paths

- UI: `components/home/`, `components/settings/`, `components/camera/`
- Storage: `lib/storage/receiptDb.ts`
- PWA: `app/sw.ts`, `components/pwa/`
