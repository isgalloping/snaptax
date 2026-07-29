# Compliance P3 — Security Baseline

**Date:** 2026-06-30  
**Status:** Approved (design)  
**Parent:** [`2026-06-30-compliance-master-matrix.md`](./2026-06-30-compliance-master-matrix.md)  
**Milestone:** M2

---

## 1. Goal

统一 **Security by Default** 技术基线文档，与 Privacy 披露及实现一致。

---

## 2. Controls matrix

| 控制 | 实现 | 披露位置 |
|------|------|----------|
| **TLS 1.3** | Vercel HTTPS | Privacy §6 |
| **AES-256 at rest** | Neon / Blob 提供商 | Privacy §6 |
| **本地图像 AES-GCM-256** | OPFS + `lib/storage/crypto/aesGcm.ts` | Privacy §1/§6 · Settings |
| **Ghost HMAC** | HttpOnly cookie · `GHOST_HMAC_SECRET` | Internal + api-security ADR |
| **Google OAuth** | profile+email only | Privacy §2 |
| **Paddle Webhook HMAC** | `verifyPaddleWebhookSignature` | Privacy §5 · P5 |
| **Receipt 归属** | `receiptWhereForActor` | api-security ADR |
| **Signed image URL** | `GET /api/receipts/:id/image` ≤15min | 12-local-image-storage |
| **Rate limiting** | Ghost/IP/User buckets | logging-design |
| **日志脱敏** | email mask · no image bytes | logging-design |
| **CSP / security headers** | `lib/server/securityHeaders` | Internal doc |

---

## 3. Least privilege (document)

| 层 | 原则 |
|----|------|
| Vercel env | 生产 secret 仅 Production；Preview 隔离 |
| DB | App role 无 SUPERUSER；迁移单独角色 |
| Blob | RW token scoped；无 public list |
| OpenAI | Server-only key；客户端 never |

---

## 4. Deliverable

`docs/tech/SECURITY-BASELINE.md`（tech 目录；链自 Privacy）

---

## 5. Acceptance

1. Baseline 每行有 code pointer 或 infra 引用
2. Privacy 不承诺未实现能力（如「全字段本地加密」）
3. Paddle webhook test 仍 pass
