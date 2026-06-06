# 01 — 系统架构

## 1.1 总览

Snap1099 MVP 采用 **Next.js 16 全栈单体**，部署在 **Vercel**，面向北美 1099 工人的 **PWA**。

```
                    ┌──────────────────────────────────────┐
                    │           Vercel Project              │
                    │  ┌────────────────────────────────┐  │
                    │  │   Next.js App (snaptax)         │  │
                    │  │  ┌──────────┐  ┌─────────────┐  │  │
                    │  │  │ RSC/SSR  │  │ Client PWA  │  │  │
                    │  │  │ pages    │  │ Components  │  │  │
                    │  │  └──────────┘  └──────┬──────┘  │  │
                    │  │         Route Handlers /api/*    │  │
                    │  └──────────────┬───────────────────┘  │
                    └─────────────────┼──────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
 Vercel Postgres (PostgreSQL)   Vercel Blob                   External APIs
 (Neon)                         (receipt images)              Google OAuth
 users/receipts/                                            OpenAI Vision
 entitlements                                               Paddle
```

## 1.2 Vercel 组件映射

| Vercel 能力 | 用途 |
|-------------|------|
| **Hosting + CDN** | PWA 静态资源、Serwist SW |
| **Serverless Functions** | `/app/api/**/route.ts` |
| **Vercel Postgres** | **PostgreSQL** — 用户、小票元数据、Ghost 绑定、报税季权益 |
| **Vercel Blob** | 小票 JPEG 原图 |
| **Environment Variables** | 密钥分 Preview / Production |
| **Preview Deployments** | PR 预览环境 |
| **Analytics（可选）** | Web Vitals、KPI 辅助 |

## 1.3 逻辑分层

| 层 | 目录（目标） | 职责                           |
|----|--------------|------------------------------|
| **Presentation** | `app/`, `components/` | UI、PWA、相机、底部面板               |
| **Client Domain** | `lib/client/` | 离线队列、sync、session、ghost_id   |
| **API** | `app/api/` | HTTP 边界、鉴权、校验                |
| **Server Domain** | `lib/server/` | 业务规则、状态机                     |
| **Integrations** | `lib/integrations/` | google, openai, paddle, blob |
| **Data Access** | `lib/prisma.ts`, `prisma/`, `db/` | **Prisma ORM** → **PostgreSQL** |

## 1.4 部署单元

- **单 Vercel Project** 绑定 Git 仓库 main → Production
- **自定义域名** + HTTPS（PWA、相机、Google OAuth 必需）
- **无独立后端服务**（MVP）

## 1.5 非功能需求

| 指标 | 目标 |
|------|------|
| 首屏可拍照 | ≤ 1.5s（弱网，SW 预缓存后） |
| API P95（读） | < 300ms（不含 AI） |
| AI 处理 P95 | < 15s（OpenAI Vision） |
| 可用性 | 依赖 Vercel SLA；离线仅客户端 |

## 1.6 安全边界

- 所有写 API 需 `ghost_id` 或 Google session
- Webhook 仅 Paddle 验签入口
- Blob 读：signed URL 或 authenticated proxy
- 密钥仅存 Vercel Env，不入客户端（除 `NEXT_PUBLIC_*`）
