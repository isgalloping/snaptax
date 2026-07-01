# Compliance P5 — Security Operations

**Date:** 2026-06-30  
**Status:** Approved (design)  
**Parent:** [`2026-06-30-compliance-master-matrix.md`](./2026-06-30-compliance-master-matrix.md)  
**Milestone:** M4

---

## 1. Goal

建立 **安全事件响应** 能力：72 小时内通知（GDPR Art. 33 对齐）、审计日志、备份恢复、部署回滚 Runbook。

---

## 2. Deliverables

| Artifact | Location | Audience |
|----------|----------|----------|
| 对外摘要 | `docs/legal/security-incident.md` | 用户 / Privacy §10 链接 |
| IRP（完整） | `docs/ops/security-incident-response.md` | 内部团队 |
| 备份/恢复 | `docs/ops/backup-restore.md` | 内部 |
| 回滚 | `docs/ops/deployment-rollback.md` | 内部（链 `09-deployment-vercel.md`） |
| 通知模板 | `docs/ops/templates/breach-notification-email.md` | 内部 |

---

## 3. IRP phases

| 阶段 | 动作 | SLA |
|------|------|-----|
| **Detect** | Vercel alerts · 异常 5xx · Paddle/OpenAI 失败 spike | — |
| **Triage** | 指定 incident commander · severity P1–P3 | **4h** 内分类 |
| **Contain** | 轮换 secret · 禁用 webhook · rate limit | P1 **24h** |
| **Notify** | 监管机构（如适用）· 受影响用户 | **72h** 内用户通知（高风险） |
| **Recover** | DB restore · Blob integrity · redeploy | Runbook |
| **Post-mortem** | 7 天内内部 RCA | — |

---

## 4. Audit logging (existing + extend)

- **已有：** `withRequestLog` · module 枚举 · email 脱敏 · `requestId`  
- **M4 补充：** 文档化保留 90 天 · 禁止字段清单 · Ghost `ipHash` 用途  

---

## 5. Backup & rollback

| 组件 | 机制 |
|------|------|
| Postgres (Neon) | 提供商 PITR / 每日快照 — 文档化 RPO/RTO 目标 |
| Blob | 版本/软删策略（按 Vercel 能力） |
| App | Vercel 上一 deploy 一键 promote rollback |
| Secrets | Vercel env 历史 + 轮换清单 |

**RPO/RTO 目标（MVP 文档化）：** RPO 24h · RTO 4h（P1 incident）

---

## 6. Acceptance

1. `security-incident.md` 公开 72h 承诺 + legal@  
2. IRP 桌面演练 1 次有记录（日期、参与人、发现项）  
3. 回滚 Runbook 可在 staging 走通  
4. Privacy §10 链接有效
