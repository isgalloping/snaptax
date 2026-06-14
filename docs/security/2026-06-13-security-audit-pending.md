# Snap1099 安全审计 — 待处理项

**日期：** 2026-06-13  
**范围：** `codeworks/snaptax` 全栈（API、认证、计费、上传、导出、Flags）  
**状态：** 待处理  
**审计方式：** 静态代码审查（未做渗透测试 / 依赖 CVE 扫描）

---

## 摘要

本次审查覆盖 13 个 API 路由、Ghost HMAC / Session JWT 认证链、Paddle Webhook、Vercel Blob 私有存储、Vercel Flags 验证旁路，以及客户端 Paywall / 导出门控。

**整体结论：** 核心 IDOR 防护（`assertReceiptAccess`）、Ghost HMAC 签名校验、Google ID Token 验证、Blob 私有访问 + 短时签名 URL 等设计合理。**未发现**可直接未授权读取他人小票或绕过登录导出数据的 Critical 级漏洞。

但存在若干 **High / Medium** 级配置与业务逻辑风险，主要集中在：**限流可静默失效**、**Paddle Webhook 校验不完整**、**生产验证 Flags 误配**、**缺少安全响应头**。以下按优先级列出待修复项。

---

## 风险矩阵

| ID | 严重度 | 标题 | 状态 |
|----|--------|------|------|
| SEC-01 | 🔴 High | 限流依赖 Upstash KV，缺失时完全放行 | ✅ Phase 1 |
| SEC-02 | 🔴 High | Paddle Webhook 未校验交易状态与金额 | ✅ Phase 1 |
| SEC-03 | 🔴 High | Webhook 信任客户端传入的 `custom_data.userId` | ✅ Phase 2 |
| SEC-04 | 🔴 High | 生产环境若使用占位 Webhook Secret 可被伪造 | ✅ Phase 1 |
| SEC-05 | 🔴 High | Vercel Flags 验证旁路误配可导致免费导出 | ✅ Phase 1 |
| SEC-06 | 🟠 Medium | 缺少 CSP / 安全响应头（无 middleware） | ✅ Phase 2 |
| SEC-07 | 🟠 Medium | `/process` 重试接口无限流，可滥用 OpenAI 配额 | ✅ Phase 2 |
| SEC-08 | 🟠 Medium | Ghost 注册无限流，存在存储 / DB DoS 风险 | ✅ Phase 3 |
| SEC-09 | 🟠 Medium | `X-Forwarded-For` IP 限流可被伪造 | ✅ Phase 3 |
| SEC-10 | 🟠 Medium | `industry` 字段未校验，存在 Prompt 注入 | ✅ Phase 2 |
| SEC-11 | 🟠 Medium | `X-Tax-Region` 客户端可控，影响报税区域锁定 | ✅ Phase 3 |
| SEC-12 | 🟠 Medium | GHOST_HMAC_SECRET 与 AUTH_SECRET 共享 fallback | ✅ Phase 3 |
| SEC-13 | 🟡 Low | Flags 发现端点公开暴露 flag 结构 | 待处理 |
| SEC-14 | 🟡 Low | 导出 CPA 包含 7 天有效 presigned 图片 URL | 待处理 |
| SEC-15 | 🟡 Low | 登出未清除 Ghost Cookie | 待处理 |
| SEC-16 | 🟡 Low | Paywall 乐观 UI 依赖客户端 `checkout.completed` 事件 | 待处理 |

---

## 🔴 High — 待处理

### SEC-01：限流依赖 Upstash KV，缺失时完全放行

**位置：** `lib/api/rateLimit.ts`

```typescript
if (!limiter) return { ok: true };
```

当 `KV_REST_API_URL` / `KV_REST_API_TOKEN` 未配置时，Ghost 每小时限额与 IP 每分钟限额 **全部跳过**。Ghost 小票数量上限（`RECEIPT_GHOST_MAX_UNBOUND`）仍生效，但已登录用户上传不受 IP 限流保护。

**影响：** 生产环境若忘记配置 Upstash，攻击者可高频上传触发 OpenAI Vision 调用，造成 **API 费用耗尽（DoS / 成本攻击）**。

**建议修复：**
- [ ] 生产环境启动时检测 KV 缺失并 **fail-fast**（或降级为进程内限流）
- [ ] 对已登录用户的 `POST /api/receipts` 同样施加 IP / userId 限流
- [ ] 在部署 checklist 中强制验证 Upstash 连通性

---

### SEC-02：Paddle Webhook 未校验交易状态与金额

**位置：** `app/api/webhooks/paddle/route.ts`

当前仅检查 `event_type === "transaction.completed"`，**未验证**：
- `data.status` 是否为 `completed` / `paid`
- 交易金额是否 ≥ 预期 $49
- 货币是否为 USD

**影响：** 若 Paddle 对异常交易（退款中、部分完成、$0 测试单）也发送 `transaction.completed`，可能 **错误授予导出权益**。

**建议修复：**
- [ ] 校验 `data.status === "completed"`（以 Paddle Billing API 文档为准）
- [ ] 校验 `data.details.totals.total >= 49` 且 currency 正确
- [ ] 对不符合条件的 webhook 记录 warn 日志并返回 200（幂等）但不写 entitlement

**参考：** `docs/tech/07-paddle-billing.md` §7.5 伪代码已要求 `status === 'completed'`，**实现与文档不一致**。

---

### SEC-03：Webhook 信任客户端 `custom_data.userId`

**位置：**
- 客户端：`components/settings/PaywallSheet.tsx` — `paddle.Checkout.open({ customData: { userId, taxSeason } })`
- 服务端：`app/api/webhooks/paddle/route.ts` — 直接 `upsert` 该 userId

**影响：** 恶意用户可在浏览器 DevTools 中修改 `Checkout.open` 的 `customData.userId` 为 **任意 UUID**。若攻击者自行付费 $49，可将权益 **赠予** 其他账户；更现实的滥用是 **批量探测有效 userId** 并结合社工。Webhook 侧 **从未** 与 Paddle 交易记录中的 customer 做服务端交叉验证。

**建议修复：**
- [ ] Webhook 处理时调用 Paddle API `GET /transactions/{id}` 二次确认
- [ ] 比对 Paddle customer email 与 `snaptax_users.user_email`
- [ ] 或在 checkout 前服务端签发一次性 `checkoutIntent` token，Webhook 只信任 token 映射的 userId

---

### SEC-04：占位 Webhook Secret 在非生产环境跳过验签

**位置：** `lib/server/paddleWebhook.ts` L53–68

```typescript
if (process.env.NODE_ENV !== "production" && isPaddleWebhookSecretPlaceholder(secret)) {
  return true; // 跳过验签
}
```

**影响：** Preview / Staging 部署若使用占位 secret（`changeme`、`placeholder` 等），**任何人可伪造 webhook** 授予任意用户导出权益。若 Preview URL 对外可访问，风险为 High。

**建议修复：**
- [ ] Preview 环境强制使用真实 Paddle Sandbox webhook secret
- [ ] 移除 skip 逻辑，或限制为 `NODE_ENV === 'development'` 且仅 localhost
- [ ] 启动时对 production/preview 检测 placeholder secret 并拒绝启动

---

### SEC-05：Vercel Flags 验证旁路误配可导致免费导出

**位置：**
- `flags/verify.ts` — `runModel`、`verfyUser`、`isNeedPay`、`isMockAI`
- `lib/verify/buildVerifyContext.ts`
- `app/api/entitlements/current/route.ts` — GET 时调用 `ensureBypassEntitlement`
- `app/api/export/tax-pack/route.ts`

当 `runModel=verify` 且当前用户 email 匹配 `verfyUser` 且 `isNeedPay=false` 时，**无需 Paddle 付款** 即可导出。

**影响：** 生产 Dashboard 误操作 Flags → **任意白名单邮箱免费导出 + 可选 Mock AI**。属于 **运维配置风险**，但影响直接关联收入。

**建议修复：**
- [ ] 生产环境对 `runModel=verify` 增加二次门禁（如 `VERCEL_ENV !== 'production'` 硬编码拒绝 bypass）
- [ ] `ensureBypassEntitlement` 写入时发送告警 / 审计日志（已有部分日志，需接入监控）
- [ ] 定期审计 `snaptax_season_entitlements.channel_code = 'verify_bypass'` 记录

---

## 🟠 Medium — 待处理

### SEC-06：缺少安全响应头

**位置：** 项目无 `middleware.ts`，`next.config.ts` 未配置 `headers()`。

**影响：** 无 CSP、X-Frame-Options、X-Content-Type-Options、Referrer-Policy 等，增加 **点击劫持** 与 **XSS 影响面**（当前 XSS 面较小，但 Google / Paddle 第三方脚本较多）。

**建议修复：**
- [ ] 添加 `middleware.ts` 或 `next.config.ts` headers
- [ ] CSP 至少限制 `script-src` 为 self + Google + Paddle 域名
- [ ] `X-Frame-Options: DENY` 或 CSP `frame-ancestors 'none'`

---

### SEC-07：`POST /api/receipts/[id]/process` 无限流

**位置：** `app/api/receipts/[id]/process/route.ts`

已认证用户可对同一小票 **反复触发** OpenAI Vision（status 非 done 时），无速率限制。

**影响：** OpenAI API **成本滥用**；恶意脚本可持续调用直至配额耗尽。

**建议修复：**
- [ ] 对 process 接口施加 per-user / per-receipt 冷却（如 30s 内不可重试同一 id）
- [ ] 纳入 SEC-01 统一限流框架

---

### SEC-08：Ghost 注册无限流

**位置：** `app/api/ghost/register/route.ts`

无速率限制，攻击者可批量创建 Ghost 账户。

**影响：** DB 行膨胀、后续 Blob 存储滥用（需配合 receipt 上传）。属于 **资源耗尽** 类攻击。

**建议修复：**
- [ ] IP 级限流（如 10/min）
- [ ] 可选 CAPTCHA 或 Proof-of-Work（低优先级）

---

### SEC-09：`X-Forwarded-For` IP 限流可被伪造

**位置：** `lib/api/rateLimit.ts` — `clientIp()`

直接取 `x-forwarded-for` 第一个 IP，未校验请求是否来自可信反向代理。

**影响：** 绕过 IP 限流（在 Upstash 已配置的前提下）。

**建议修复：**
- [ ] Vercel 部署使用 `@vercel/functions` 的 `ipAddress()` 或 Platform 提供的真实 IP
- [ ] 非 Vercel 环境配置 trusted proxy 列表

---

### SEC-10：`industry` 字段 Prompt 注入

**位置：**
- `app/api/users/me/route.ts` PATCH — 无 schema 校验
- `lib/openai/receiptVision.ts` L61–63 — 直接拼入 system prompt

```typescript
const industryHint = industry
  ? `User industry context: ${industry}.`
  : "";
```

**影响：** 已登录用户可设置恶意 `industry` 字符串（最长 128 字符），尝试 **操纵 OpenAI 输出**（分类、金额、deductible 等）。

**建议修复：**
- [ ] 使用 zod enum 限定合法行业值（与 UI 选项一致）
- [ ] 拒绝不在白名单内的 PATCH 请求

---

### SEC-11：`X-Tax-Region` 客户端可控

**位置：** `lib/api/taxRegion.ts`、`lib/client/taxRegion.ts`

客户端通过 `localStorage` + 浏览器语言推断设置 `X-Tax-Region`，服务端在 Google 首次登录时 **锁定** `dataRegion`。

**影响：** 用户可在登录前手动修改 localStorage 为 `eu`/`us`，导致 **错误的税务规则与 data_region 锁定**（合规风险，非传统安全漏洞）。

**建议修复：**
- [ ] 登录时结合 IP Geo（或 Google account locale）做 sanity check
- [ ] 首次登录后禁止通过 header 修改 region（当前已锁定，但初始值可被操纵）

---

### SEC-12：GHOST_HMAC_SECRET 与 AUTH_SECRET 共享 fallback

**位置：** `lib/server/env.ts`

```typescript
getGhostHmacSecret() → GHOST_HMAC_SECRET | SUPABASE_JWT_SECRET | AUTH_SECRET
getAuthSecret()      → AUTH_SECRET | SUPABASE_JWT_SECRET | GHOST_HMAC_SECRET
```

**影响：** 若仅配置单一 secret，Ghost token 与 Session JWT 使用 **同一密钥**。一处泄露导致 **双重认证体系同时崩溃**。

**建议修复：**
- [ ] 生产环境强制独立配置 `GHOST_HMAC_SECRET` 与 `AUTH_SECRET`
- [ ] 启动时若检测到 fallback 共享则 warn / fail

---

## 🟡 Low — 待处理

### SEC-13：Flags 发现端点公开

**位置：** `app/.well-known/vercel/flags/route.ts`

公开返回 `getProviderData(...)`，暴露 flag 名称与结构（含 `verfyUser` key）。

**建议：** 限制为 Vercel 内部 / 开发环境，或移除生产路由。

---

### SEC-14：导出 CPA 包含 7 天 presigned URL

**位置：** `lib/export/receiptImageUrl.ts`

导出 CSV/ZIP 中的小票图片 URL 有效期 **7 天**。文件一旦泄露（邮件、云盘），图片在窗口期内可访问。

**建议：** 文档化风险；可选缩短 TTL 或改为导出时打包二进制而非 URL。

---

### SEC-15：登出未清除 Ghost Cookie

**位置：** `app/api/auth/logout/route.ts`

仅清除 `snap1099_session`，保留 Ghost Cookie。

**影响：** 低。同设备后续仍以原 Ghost 身份访问，可能造成 **账户切换混淆**，非跨用户数据泄露（ownership 仍隔离）。

**建议：** 登出时可选清除 Ghost Cookie 并重新 register。

---

### SEC-16：Paywall 客户端乐观 paid 状态

**位置：** `components/settings/PaywallSheet.tsx` — `checkout.completed` → `onPaid()`

客户端在 webhook 到达前即标记 paid（`useTaxExportGate` 会 poll 服务端）。**服务端导出仍 402  gate**，实际数据不可绕过。

**建议：** 保持现状即可；确保 UI 在 poll 失败时不展示 "Export Again"（当前已实现）。

---

## ✅ 已验证的安全控制（无需修复）

| 控制项 | 实现 |
|--------|------|
| 小票 IDOR | `assertReceiptAccess` + UUID 主键；越权返回 404 |
| Ghost 身份 | HMAC-SHA256 + `timingSafeEqual` + 90 天 TTL |
| Google 登录 | `google-auth-library` 验证 ID Token audience |
| 已绑定 Ghost 写保护 | `getActor({ requireWrite: true })` 拒绝 bound ghost 写操作 |
| 文件上传 | Magic bytes 校验 + 5MB 上限 + Sharp 重编码 |
| Blob 访问 | `access: "private"` + 15min 签名 URL |
| 序列化 | `serializeReceipt` 不返回 `aiRaw` / `imageUrl` |
| 错误响应 | `mapErrorToResponse` 不泄露内部 stack |
| Paywall 无 Paddle | 已阻断假成功（`PaywallSheet` 显示红字，不调用 `onPaid` 假路径） |
| Session Cookie | `httpOnly` + `sameSite: lax` + production `secure` |

---

## 建议修复优先级

```
P0（上线前）  SEC-01, SEC-02, SEC-04, SEC-05
P1（本迭代）  SEC-03, SEC-06, SEC-07, SEC-10
P2（下一迭代） SEC-08, SEC-09, SEC-11, SEC-12
P3（按需）    SEC-13 ~ SEC-16
```

---

## 后续审计建议

- [ ] 运行 `npm audit` / Dependabot 依赖 CVE 扫描
- [ ] 对 Preview 环境做 webhook 伪造渗透测试
- [ ] 验证 Vercel 生产 env 中 Upstash / Paddle / Flags 配置完整性
- [ ] 补充 `npm run test:unit` 中的安全回归用例（Webhook 负例、限流 fallback）

---

*本文件由 2026-06-13 静态代码审计生成。修复完成后请将对应 SEC-ID 标记为 ✅ 并注明 PR / commit。*
