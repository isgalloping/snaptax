# Snap1099 技术文档

> **全栈 MVP 实施蓝图** · Vercel 强依赖 · 与 PRD / PRODUCT-SPEC 同步

## 阅读顺序

| 顺序 | 文档 | 内容 |
|------|------|------|
| 0 | [../product/PRODUCT-SPEC.md](../product/PRODUCT-SPEC.md) | 产品铁律（必读） |
| 1 | [01-architecture.md](./01-architecture.md) | 系统架构与 Vercel 组件 |
| 2 | [05-auth-ghost-google.md](./05-auth-ghost-google.md) | Ghost + Google 身份 |
| 3 | [DB-DESIGN-SPEC.md](./DB-DESIGN-SPEC.md) | **数据库设计规范（改表必读）** |
| 4 | [04-data-model.md](./04-data-model.md) | 数据库表结构明细 |
| 5 | [03-api.md](./03-api.md) | API 契约 |
| 6 | [02-frontend.md](./02-frontend.md) | PWA / 离线 / 客户端 |
| 7 | [06-receipt-ai-pipeline.md](./06-receipt-ai-pipeline.md) | OpenAI 小票流水线 |
| 8 | [07-paddle-billing.md](./07-paddle-billing.md) | Paddle 支付与权益 |
| 9 | [08-export.md](./08-export.md) | Excel 导出 |
| 10 | [09-deployment-vercel.md](./09-deployment-vercel.md) | 部署与环境变量 |
| 11 | [10-testing-observability.md](./10-testing-observability.md) | 测试与监控 |

## 设计决策 ADR

- [../superpowers/specs/2026-06-05-tech-architecture-design.md](../superpowers/specs/2026-06-05-tech-architecture-design.md)
- [../superpowers/specs/2026-06-05-google-auth-prd-design.md](../superpowers/specs/2026-06-05-google-auth-prd-design.md)
- [../superpowers/specs/2026-06-05-paddle-paywall-design.md](../superpowers/specs/2026-06-05-paddle-paywall-design.md)
- [../superpowers/specs/2026-06-05-db-init-table-design.md](../superpowers/specs/2026-06-05-db-init-table-design.md)
- [../superpowers/specs/2026-06-05-compliance-privacy-design.md](../superpowers/specs/2026-06-05-compliance-privacy-design.md)

## 代码地图（当前 → 目标）

| 模块 | 现状 | 目标 |
|------|------|------|
| 身份 | 手机号 RegisterSheet | Google + Ghost API |
| 小票 | Client mock AI | API + OpenAI + Blob + **Prisma** |
| 付费 | Mock 按钮 | Paddle.js + Webhook + **Prisma** entitlements |
| 存储 | 仅 IndexedDB | IndexedDB + **PostgreSQL**（Prisma sync） |
