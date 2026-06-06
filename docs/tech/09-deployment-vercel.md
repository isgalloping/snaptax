# 09 — Vercel 部署

## 9.1 前置条件

- GitHub/GitLab 仓库连接 Vercel
- 自定义域名 + SSL
- Vercel Pro（建议：AI 函数 `maxDuration`、团队 env）

## 9.2 Vercel 集成开通

1. **PostgreSQL** — Storage → Create Database → **Postgres** → 绑定 `DATABASE_URL`（Neon 托管）
2. **Blob** — Storage → Blob → `BLOB_READ_WRITE_TOKEN`
3. **Environment Variables** — Production / Preview / Development

## 9.3 环境变量清单

### 公共（客户端）

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
NEXT_PUBLIC_APP_URL=https://app.snap1099.com
```

### 服务端密钥

```
DATABASE_URL=
BLOB_READ_WRITE_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_SECRET=
OPENAI_API_KEY=
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_PRICE_ID=
```

### 可选

```
OPENAI_MODEL=gpt-4o
RECEIPT_CONFIDENCE_THRESHOLD=0.7
CURRENT_TAX_SEASON=2026
```

## 9.4 构建配置

`package.json` scripts（目标）：

```json
{
  "postinstall": "prisma generate",
  "build": "prisma generate && next build",
  "db:migrate:deploy": "prisma migrate deploy",
  "db:migrate:dev": "prisma migrate dev",
  "db:studio": "prisma studio"
}
```

依赖：`prisma`（dev）、`@prisma/client`（dependencies）

`next.config.ts` — `@serwist/turbopack` 已配置。

### Prisma + PostgreSQL (Vercel Postgres)

- `DATABASE_URL` 由 Vercel Postgres 集成自动注入
- Production 使用 Neon **connection pooling** URL（Vercel 控制台提供的 pooled 串）
- 首次部署前：`prisma migrate deploy`（可加入 Vercel Build Command 或 Deploy Hook）

### 函数超时（vercel.json 可选）

```json
{
  "functions": {
    "app/api/receipts/**": { "maxDuration": 60 },
    "app/api/export/**": { "maxDuration": 30 }
  }
}
```

## 9.5 Webhook URL

| 服务 | URL |
|------|-----|
| Paddle | `https://{domain}/api/webhooks/paddle` |
| Google OAuth | `https://{domain}/api/auth/callback/google` |

Preview 部署需在 Paddle Sandbox 单独配置。

## 9.6 PWA 生产检查

- [ ] HTTPS
- [ ] `/` 在 SW precache
- [ ] `manifest.webmanifest` 可访问
- [ ] 相机权限（Permissions-Policy 如需要）

## 9.7 本地开发

```bash
cp .env.example .env.local
npx prisma migrate dev
npm run dev
# 使用 ngrok / Cloudflare Tunnel 测 Webhook 与 OAuth 回调
vercel env pull .env.local
```

## 9.8 CI

- PR → Vercel Preview + Neon branch + `prisma migrate deploy`
- main → Production + `prisma migrate deploy`
- 可选：GitHub Action `npm run lint` + `prisma generate` + `npm run build`
