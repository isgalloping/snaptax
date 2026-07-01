# Snap1099 技术文档

> **全栈 MVP 实施蓝图** · Vercel 强依赖 · 与 PRD / PRODUCT-SPEC 同步

## 新人本地开发速查

`.env.local` 最小集见根目录 [AGENTS.md](../../AGENTS.md)（Postgres、HMAC、限流）。**桌面调试小票 upload / Vision** 时建议在 AGENTS 基础上追加：

| 变量 | 典型值 | 作用 |
|------|--------|------|
| `RECEIPT_GHOST_HOURLY` | `100` | 避免本地 429（默认 Ghost 10/h） |
| `RECEIPT_IP_PER_MIN` | `200` | 同上（默认 IP 60/min） |
| `NEXT_PUBLIC_SKIP_LOCAL_OCR` | `1` | 跳过 Tesseract，直接走服务端 Vision |
| `NEXT_PUBLIC_OCR_MAX_EDGE` | `960` | 可选；缩小本地 OCR 输入（默认 1280） |

详述：[09-deployment-vercel.md §9.7](./09-deployment-vercel.md#97-本地开发) · [11-ocr-pipeline-design.md §10.1](./11-ocr-pipeline-design.md#101-本地桌面调试推荐写入-envlocal)。

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
| 7b | [11-ocr-pipeline-design.md](./11-ocr-pipeline-design.md) | **OCR 双路径（第一阶段）；数据一致性见第二阶段** |
| 7c | [12-local-image-storage-design.md](./12-local-image-storage-design.md) · [Plan](../superpowers/plans/2026-06-19-local-image-storage-opfs.md) | **本地图片 OPFS + 压缩 + 90d 回收** |
| 8 | [07-paddle-billing.md](./07-paddle-billing.md) | Paddle 支付与权益 |
| 9 | [08-export.md](./08-export.md) | Excel 导出 |
| 10 | [09-deployment-vercel.md](./09-deployment-vercel.md) | 部署与环境变量 |
| 11 | [10-testing-observability.md](./10-testing-observability.md) | 测试与监控 |
| 12 | [SECURITY-BASELINE.md](./SECURITY-BASELINE.md) | **安全基线控制矩阵（合规 M2）** |
| 13 | [../ops/README.md](../ops/README.md) | **安全运营 Runbook（合规 M4）** |

## 设计决策 ADR

- [../superpowers/specs/2026-06-05-tech-architecture-design.md](../superpowers/specs/2026-06-05-tech-architecture-design.md)
- [../superpowers/specs/2026-06-05-google-auth-prd-design.md](../superpowers/specs/2026-06-05-google-auth-prd-design.md)
- [../superpowers/specs/2026-06-05-paddle-paywall-design.md](../superpowers/specs/2026-06-05-paddle-paywall-design.md)
- [../superpowers/specs/2026-06-05-db-init-table-design.md](../superpowers/specs/2026-06-05-db-init-table-design.md)
- [../superpowers/specs/2026-06-05-db-product-alignment-design.md](../superpowers/specs/2026-06-05-db-product-alignment-design.md)
- [../superpowers/specs/2026-06-05-api-security-design.md](../superpowers/specs/2026-06-05-api-security-design.md)
- [../superpowers/specs/2026-06-05-compliance-privacy-design.md](../superpowers/specs/2026-06-05-compliance-privacy-design.md) — **MVP 行为以 PRODUCT-SPEC v1.2 为准**
- [../superpowers/specs/2026-06-06-product-tech-code-consistency-audit.md](../superpowers/specs/2026-06-06-product-tech-code-consistency-audit.md)
- [../superpowers/specs/2026-06-06-logging-design.md](../superpowers/specs/2026-06-06-logging-design.md)
- [../superpowers/specs/2026-06-07-tax-savings-regional-design.md](../superpowers/specs/2026-06-07-tax-savings-regional-design.md)
- [../superpowers/specs/2026-06-07-mvp-master-roadmap-design.md](../superpowers/specs/2026-06-07-mvp-master-roadmap-design.md)
- [../superpowers/plans/2026-06-07-mvp-master-implementation.md](../superpowers/plans/2026-06-07-mvp-master-implementation.md) — **MVP 总落地**

## 代码地图（当前 → 目标）

| 模块 | 现状 | 目标 |
|------|------|------|
| 身份 UI | Google 软/硬引导 + 账户区（mock 登录） | Google GIS + Ghost API |
| 小票 AI | Client mock AI | **本地 OCR + 文本分类 + Vision 兜底** · [11-ocr-pipeline-design.md](./11-ocr-pipeline-design.md) |
| 付费 UI | Paywall 面板 + mock Paddle | Paddle.js Overlay + Webhook |
| 存储 | IndexedDB（`snaptax_*` stores）+ 本地 auth/付费状态 | IndexedDB + **PostgreSQL** sync |
