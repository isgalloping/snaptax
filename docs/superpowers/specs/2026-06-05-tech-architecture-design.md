# Snap1099 全栈技术架构 — 设计决策

**日期：** 2026-06-05  
**状态：** 已批准  
**依据：** `docs/prd/0.0.1.md`、`docs/product/PRODUCT-SPEC.md  

---

## 决策摘要

| 决策点 | 选择 |
|--------|------|
| 文档目标 | 全栈 MVP 实施蓝图（研发可直接开工） |
| 架构形态 | Next.js 16 一体化（App Router + Route Handlers） |
| 部署 | **强依赖 Vercel**（Hosting、Serverless Functions、Postgres、Blob） |
| 数据库 | **PostgreSQL**（托管：Vercel Postgres / Neon） |
| ORM | **Prisma**（`prisma/schema.prisma`） |
| 对象存储 | Vercel Blob（小票原图） |
| 身份 | Google OAuth 2.0 + Ghost ID 静默绑定 |
| AI 小票 | OpenAI GPT-4o Vision（单图 JSON 输出） |
| 支付 | Paddle Overlay + Webhook → 报税季权益 |
| 文档结构 | `docs/tech/` 分模块（10 篇 + README） |

---

## 架构原则

1. **Vercel-first**：优先使用 Vercel 原生集成（Postgres、Blob、Environment、Preview Deployments）。
2. **离线优先客户端**：IndexedDB 为写前缓存；服务端为权威数据源（登录后）。
3. **异步非阻塞**：小票 AI 处理不阻塞拍照 UI；客户端轮询或 SSE。
4. **可替换集成层**：OpenAI / Paddle / Blob 通过 adapter 封装，便于后续替换。
5. **MVP 范围**：单区域、单租户、无多 Google 账号切换 UI。

---

## 系统上下文

```
[蓝领用户 PWA] ←→ [Vercel: Next.js + API]
                        ├─ Vercel Postgres
                        ├─ Vercel Blob
                        ├─ Google OAuth
                        ├─ OpenAI Vision
                        └─ Paddle Billing
```

---

## 核心流程（时序）

### Ghost → Google 绑定

1. Client 生成 `ghost_id` → localStorage  
2. 未登录 API 携带 `X-Ghost-Id`  
3. Google 登录 → 服务端验证 ID Token → upsert `users` → insert `ghost_bindings`  
4. Client 上传 IndexedDB 中未同步小票  

### 小票处理

1. `POST /api/receipts` → Blob 存图 → DB `processing`  
2. `POST /api/receipts/:id/process`（或 inline）→ OpenAI Vision → DB `done|blurry`  
3. Client 轮询 `GET /api/receipts/:id`  

### 导出

1. Google session 校验  
2. `GET /api/entitlements/current` → 本季已付  
3. `POST /api/export/tax-pack` → Excel → share  

---

## 与 PRD 映射

| PRD | 技术实现 |
|-----|----------|
| §2.1 Ghost | Client `ghost_id` + `ghost_bindings` |
| §2.3 软引导 Google | Client UI + `POST /api/auth/google` |
| §2.4.3 Paddle $49/季 | Paddle.js + `season_entitlements` + Webhook |
| §2.4.3 Export Again | entitlement 检查，跳过 Paywall |
| 离线拍照 | IndexedDB + 联网 sync API |
| 三态小票 | `receipts.status`: processing / done / blurry |

---

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| Vercel Function 超时（OpenAI） | MVP 同步处理 + `maxDuration`；后续 QStash/Inngest |
| 离线冲突 | MVP 服务端为准 |
| Paddle Webhook 重复 | idempotent on `paddle_transaction_id` |
| OpenAI 成本 | 按张计费监控；confidence 低 → blurry 减少错误归类 |

---

## 文档清单

见 `docs/tech/README.md`。

---

## 范围外（MVP）

- 多语言 i18n 后端
- Apple Sign-In
- 自托管 / 非 Vercel 部署路径
- 实时 SSE（可用轮询代替）
