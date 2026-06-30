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
GHOST_HMAC_SECRET=          # 必填 — Ghost Cookie HMAC（见 §9.3.1）
AUTH_SECRET=                # 必填 — Session JWT（见 §9.3.1）
OPENAI_API_KEY=
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=      # 必填 — production/preview 不可为 placeholder
PADDLE_PRICE_ID=
```

### 9.3.1 身份密钥（Production / Preview 强制）

`instrumentation.ts` 在 **production** 与 **preview** 启动时执行 `runStartupChecks()`（见 `lib/server/startupChecks.ts`）。以下任一项缺失或不合规，**整站无法启动**，表现为：

```text
Error: An error occurred while loading instrumentation hook:
GHOST_HMAC_SECRET and AUTH_SECRET must both be set in production/preview
```

连带症状：Google 登录、`POST /api/ghost/register`、`POST /api/auth/google` 等全部失败。

| 变量 | 用途 | 要求 |
|------|------|------|
| `GHOST_HMAC_SECRET` | 签发/校验 `snap1099_ghost` Cookie | Production/Preview **必须显式设置**（无 fallback） |
| `AUTH_SECRET` | 签发/校验 `snap1099_session` Cookie | 同上 |
| 两者关系 | 独立密钥 | **必须不同**；建议各 ≥32 字符随机串 |

生成示例（本地生成后粘贴到 Vercel → Settings → Environment Variables，**Production 与 Preview 都要配**）：

```bash
openssl rand -base64 32   # → GHOST_HMAC_SECRET
openssl rand -base64 32   # → AUTH_SECRET（勿与上一行相同）
```

**注意：**

- 仅配 `AUTH_SECRET` 而不配 `GHOST_HMAC_SECRET` 仍会启动失败（与本地 `.env.local` 双变量要求一致）。
- 修改上述变量后须 **重新 Deploy**（触发新构建），不能依赖旧 deployment。
- Development（`vercel dev` / 本地）允许 `GHOST_HMAC_SECRET` 与 `AUTH_SECRET` 在缺省时 fallback，但生产环境不允许。

Google 登录另需（build 时打入客户端 bundle）：

- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`（可与 `GOOGLE_CLIENT_ID` 相同；`next.config.ts` 会在 build 时从 `GOOGLE_CLIENT_ID` 回填）

详见 [`05-auth-ghost-google.md`](./05-auth-ghost-google.md)、[`docs/superpowers/specs/2026-06-14-google-login-production-fix-design.md`](../superpowers/specs/2026-06-14-google-login-production-fix-design.md)。

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
- [ ] `GHOST_HMAC_SECRET` + `AUTH_SECRET` 已在 Production/Preview 配置且互不相同
- [ ] `PADDLE_WEBHOOK_SECRET` 为真实 Paddle destination secret（非 placeholder）

## 9.7 本地开发

```bash
cp .env.example .env.local
npx prisma migrate dev
npm run dev
# 使用 ngrok / Cloudflare Tunnel 测 Webhook 与 OAuth 回调
vercel env pull .env.local   # 见下方「pull 之后必做」
```

### `vercel env pull` 之后必做

`vercel env pull` 会写入 **Supabase pooler**（`aws-*-*.pooler.supabase.com:6543`）。`lib/server/env.ts` 里 `getDatabaseUrl()` 优先级为：

`DATABASE_URL` → `POSTGRES_PRISMA_URL` → `POSTGRES_URL_NON_POOLING` → `POSTGRES_URL`

**未设 `DATABASE_URL` 时** dev 默认走 pooler。在部分网络（高延迟 / 防火墙）下 pooler 连接约 **5s 超时**，表现为：

```text
Prisma P1001 — Can't reach database server at `aws-1-us-east-1.pooler.supabase.com:6543`
POST /api/ghost/register 500  （限流表 `snaptax_rate_limit_buckets` 写入失败）
```

**二选一：**

| 方案 | 配置 |
|------|------|
| **远程 Supabase（常见）** | 在 `.env.local` **顶部**加直连（非 pooler）：<br>`DATABASE_URL=postgres://...@db.<project>.supabase.co:5432/postgres?sslmode=require&connect_timeout=30` |
| **本机 Postgres** | `DATABASE_URL=postgresql://snaptax:snaptax@localhost:5432/snaptax?schema=public`（见根目录 `AGENTS.md`） |

改完 **必须重启** `npm run dev`。勿把含密码的 `.env.local` 提交 git。

### 本地限流（建议写入 `.env.local`）

生产默认：Ghost **10 次/小时**、同 IP **60 次/分钟**（`lib/api/rateLimit.ts`）。本地调试 upload/OCR 重试时容易触发 **429** `RATE_LIMITED`（与 OpenAI/maxapi 无关）。建议在本地放宽：

```
RECEIPT_GHOST_HOURLY=100
RECEIPT_IP_PER_MIN=200
```

已撞限流时可清 Postgres bucket（仅开发）：

```sql
DELETE FROM snaptax_rate_limit_buckets WHERE bucket_key LIKE 'ghost:receipt:%';
```

或等到当前小时窗口结束（bucket 的 `window_start` + 1h）。

### 本地 OCR / 桌面调试（建议写入 `.env.local`）

桌面开发无相机时用 **Choose from gallery**；Tesseract 首次识别可能很慢。可选客户端 env（详见 [11-ocr-pipeline-design.md §10.1](./11-ocr-pipeline-design.md#101-本地桌面调试推荐写入-envlocal)）：

```bash
# 跳过本地 OCR，直接 upload → 服务端 Vision（桌面调试最快）
NEXT_PUBLIC_SKIP_LOCAL_OCR=1

# 或缩小 OCR 输入（默认长边 1280）
NEXT_PUBLIC_OCR_MAX_EDGE=960
```

- `NEXT_PUBLIC_SKIP_LOCAL_OCR=1`：**不跑** Web Worker OCR；依赖 `OPENAI_API_KEY` + Blob 的上传链路（本地未配则 upload 仍 500，但可排除 OCR 耗时）。
- `NEXT_PUBLIC_OCR_MAX_EDGE=960`：仍跑 Path A 本地 OCR，仅缩小预处理尺寸。
- 修改后须重启 dev server；**生产 / Preview 勿设** `SKIP_LOCAL_OCR`。

## 9.8 CI

- PR → Vercel Preview + Neon branch + `prisma migrate deploy`
- main → Production + `prisma migrate deploy`
- 可选：GitHub Action `npm run lint` + `prisma generate` + `npm run build`
