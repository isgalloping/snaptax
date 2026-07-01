# Compliance P2 — Data Lifecycle & Retention

**Date:** 2026-06-30  
**Status:** Approved (design)  
**Parent:** [`2026-06-30-compliance-master-matrix.md`](./2026-06-30-compliance-master-matrix.md)  
**Milestone:** M2

---

## 1. Goal

成文 **Data Retention** 策略，与代码行为一致；支撑 Privacy by Design 与 GDPR 存储限制原则。

---

## 2. Retention table (canonical)

| 数据类型 | 位置 | 保留周期 | 删除触发 |
|----------|------|----------|----------|
| 小票元数据（done/processing/blurry） | IndexedDB | **18 个月**（`timestamp`） | Idle prune · Delete Account |
| 小票元数据 | Postgres（美国） | 账户存续期；Delete Account **30 天内**硬删（目标） | `DELETE /api/users/me` |
| 小票原图（full） | OPFS 加密 | 至上传成功或 **90 天** post-sync purge | `photoRetention` job |
| 缩略图 | OPFS | 随小票行 | 同上 |
| 小票图像 | Vercel Blob | 账户存续期；随 Delete Account | Server cascade |
| Ghost 会话 | Cookie + PG | Ghost 数据随 Delete / 账户绑定迁移 | Delete Account |
| Rate limit buckets | Postgres | **24h** GC window | `dbRateLimit` |
| 结构化 API 日志 | Vercel Logs | **90 天**（平台默认；文档化） | 平台 TTL |
| Export 生成文件 |  ephemeral / 用户下载 | 不长期服务端存储（MVP） | 会话结束 |

**Draft 等价物：** `status=processing` 小票 — 保留至 done/blurry/delete；不设独立「草稿」实体。

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `docs/legal/data-retention.md` | 用户可读（链自 Privacy §7） |
| Privacy §7 | 摘要 + link |

---

## 4. Code alignment tasks (M2)

- [ ] 文档常量与 `lib/client/receiptRetention.ts` · `photoRetention.ts` · `dbRateLimit.ts` 一致
- [ ] Delete Account 路径文档化 server 删 Blob+PG（已有 spec：`delete-account-full-cleanup`）
- [ ] **可携带权：** Export Tax Pack = 结构化可携带格式（CSV/XLSX）；Privacy 明示

---

## 5. Acceptance

1. `data-retention.md` 与代码常量 diff = 0
2. Privacy 链到 retention 页
3. Delete Account 描述覆盖 local + cloud
