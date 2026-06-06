# Snap1099 客户端 ↔ 服务端 API 安全设计

**日期：** 2026-06-05  
**状态：** 已批准（P0 文档；后端实施见 [implementation plan](../plans/2026-06-05-api-security.md)）  
**依据：** `docs/product/PRODUCT-SPEC.md` v1.2、`docs/tech/03-api.md`、`docs/tech/05-auth-ghost-google.md`、`docs/tech/06-receipt-ai-pipeline.md`

---

## 1. 目标

在未登录 Ghost 亦可触发 **OpenAI Vision** 的前提下，建立 **全面威胁模型（S4）**，覆盖滥用/成本、IDOR、恶意内容与 Prompt 注入、CSRF、密钥泄露、日志与 Blob 访问控制；并明确 **MVP 必做（P0）** 与 **二期（P1/P2）** 分层。

### 1.1 已锁定决策

| 决策点 | 选择 |
|--------|------|
| 威胁范围 | **S4 全面威胁模型** |
| 架构方案 | **方案 1 — API 网关层**：统一鉴权中间件 + Ghost HMAC 令牌 + 资源归属 + 服务端独占 OpenAI |
| Ghost 认证 | **HMAC 签名 Cookie/Header**，废弃「仅信任客户端自报 `X-Ghost-Id`」 |
| OpenAI | **仅服务端**；禁止客户端传入任意 `image_url` |
| Blob | **Private** + 短期 signed URL |
| MVP 部署 | **美国单区域**（与 PRODUCT-SPEC v1.2 一致） |

---

## 2. 威胁模型总览

| ID | 威胁 | 场景 | 影响 | MVP 优先级 |
|----|------|------|------|------------|
| T1 | **OpenAI 成本刷量** | 伪造 Ghost，批量 `POST /api/receipts` | 账单暴增 | **P0** |
| T2 | **IDOR** | 遍历 `receipt_id` 读/删他人小票 | 财务隐私泄露 | **P0** |
| T3 | **Ghost ID 伪造** | 攻击者使用他人 `ghost_id` | 数据劫持/污染 | **P0** |
| T4 | **密钥泄露** | `OPENAI_API_KEY` 进客户端/日志/Git | 账户接管、刷 API | **P0** |
| T5 | **恶意上传** | 非 JPEG、超大文件、畸形 EXIF | DoS、存储成本 | **P0** |
| T6 | **Prompt/视觉注入** | 小票印刷误导性文字 | 错误分类、诱导输出 | **P1** |
| T7 | **CSRF** | 诱导已登录用户触发导出/删除 | 数据损失 | **P1** |
| T8 | **SSRF** | OpenAI 使用用户提供的 URL | 内网探测 | **P0**（禁止用户 URL） |
| T9 | **Session 固定/窃取** | Cookie 未 Secure/HttpOnly | 账户劫持 | **P0** |
| T10 | **日志 PII 泄露** | 小票图/邮箱进日志 | 合规风险 | **P1** |
| T11 | **Blob URL 泄露** | 长期公开读 | 小票图像泄露 | **P0** |
| T12 | **Replay** | 重放上传/删除 | 重复扣费/状态错乱 | **P2** |

---

## 3. 认证与 Ghost 安全

### 3.1 Ghost 登记（MVP）

```
首次打开 App（联网）
  → POST /api/ghost/register（无 PII）
  ← Set-Cookie: snap1099_ghost=<HMAC-signed token>  HttpOnly Secure SameSite=Lax
  ← { ghostId }  // 可选回显；非信任依据

后续请求
  → Cookie: snap1099_ghost（优先）
  → 或 Header: Authorization: Ghost <token>
  → 服务端 verify HMAC + exp（如 90 天，滚动续期）
```

**规则：**

- **禁止**仅信任客户端自报的 `X-Ghost-Id` 字符串；若保留该 Header，必须与 **已验证 token 内 ghostId 一致**。
- **已绑定 Google 的 Ghost**：写操作 **必须** Session；Ghost token 仅只读或拒绝写，防绑定后仍用 Ghost 写。
- Google 登录：`POST /api/auth/google` 验证 ID Token → 绑定 `ghost_id`（一次性）→ Session Cookie。

### 3.2 Session（已登录）

| 属性 | 值 |
|------|-----|
| Cookie 名 | `snap1099_session` |
| 属性 | HttpOnly + Secure + SameSite=Lax |
| 载荷 | signed JWT `{ userId, exp }`（**不含** OpenAI 密钥） |
| 登出 | 清 Cookie；二期可选 session 黑名单 |

### 3.3 新增端点（MVP）

#### `POST /api/ghost/register`

**Request：** 无 body 或空 JSON  
**Response 201**
```json
{ "ghostId": "..." }
```
**Set-Cookie：** `snap1099_ghost`

---

## 4. 小票上传 `POST /api/receipts` 安全

### 4.1 请求校验

| 检查项 | 规则 |
|--------|------|
| 认证 | 有效 Ghost token **或** Session |
| Content-Type | `multipart/form-data` |
| 文件类型 | 魔数检测 JPEG/PNG；**拒绝** SVG/PDF/HTML |
| 大小 | ≤ **5 MB**（可配置 `RECEIPT_MAX_BYTES`） |
| 维度 | 可选：最大 8000×8000，防 decompression bomb |
| 频率 | Ghost：**10 张/小时**；User：**30 张/小时**（可配置） |
| 累计 | Ghost 未绑定累计 ≤ **50 张**（防无限堆） |

### 4.2 处理流水线

```
Client upload (bytes)
  → 服务端收 multipart（不信任客户端 metadata）
  → Vercel Blob put（private ACL，非 public）
  → DB insert status=processing（owner = ghost_id | user_id）
  → OpenAI Vision（base64 或 **服务端生成的短期 signed Blob URL**）
  → Zod schema + 数值范围校验
  → 更新 status done|blurry
```

**禁止：**

- 客户端传入任意 `image_url` 给 OpenAI（防 T8 SSRF）。
- 客户端提交的 `amount` / `category` / `status` 作为权威值（若有 PATCH，仅白名单字段 + 二次校验）。

### 4.3 信任边界

- AI 输出经 **Zod schema** + 业务规则（`amount ≥ 0`，`confidence` 阈值见 `06-receipt-ai-pipeline.md`）。
- OpenAI **仅**服务端；`OPENAI_API_KEY` **仅** Vercel Environment。

---

## 5. OpenAI 专项风险

| 风险 | 缓解 |
|------|------|
| **密钥泄露** | 仅 server env；禁止 `NEXT_PUBLIC_*` 暴露 OpenAI；CI secret 扫描 |
| **Prompt 注入（图像内文字）** | System prompt 固定；输出 **仅 JSON**；schema 校验；忽略非收据字段指令 |
| **异常输出** | `response_format: json_object`；解析失败 → `blurry`，不执行下游逻辑 |
| **成本** | 每 receipt 一次调用；重复 `process` 需 idempotency key；429 指数退避 + 上限 |
| **数据留存** | 合同/API 无训练；日志不存原图 base64 |
| **PII 进模型** | Ghost 阶段无邮箱；图像仅收据内容（Privacy 已披露） |

---

## 6. 授权（IDOR）与资源归属

每条涉及 `receipt_id` 的 API 必须校验归属：

```
receipt.user_id === session.userId
  OR (receipt.ghost_id === verifiedGhostId AND receipt.user_id IS NULL)
```

| 端点 | 规则 |
|------|------|
| `GET /api/receipts` | 仅列 **自己的** ghost 或 user |
| `GET /api/receipts/:id` | 归属校验，否则 **404**（非 403，防枚举） |
| `DELETE /api/receipts/:id` | 同上 |
| `POST /api/receipts/:id/process` | 同上 + `status=processing` |
| `DELETE /api/users/me` | Session only；删 Blob + DB + Ghost 绑定 |

**Google 绑定后：** 该 Ghost 的写权限收口到 Session。

---

## 7. 滥用防护与限流

| 层级 | MVP | 二期 |
|------|-----|------|
| **Edge / IP** | `/api/receipts` POST：60/min/IP | 地区异常检测 |
| **Ghost** | 10 张/小时，200 张/日 | 设备指纹 |
| **User** | 30 张/小时 | 按订阅调整 |
| **OpenAI** | 全局 concurrency 上限 + 熔断 | 队列 + QStash |
| **登录** | `/api/auth/google` 5/min/IP | CAPTCHA on abuse |

**存储：** Vercel KV 或 Upstash Redis（`ghost:{id}:hourly`、`ip:{hash}:minute`）。

**响应：** 超限时 `429` + `Retry-After`；错误体沿用 `03-api` 格式。

---

## 8. CSRF、CORS、传输

| 项 | MVP | 二期 |
|----|-----|------|
| **Cookie 写操作** | SameSite=Lax；同源 PWA JSON POST | 破坏性操作加 CSRF token 或 double-submit |
| **CORS** | `Access-Control-Allow-Origin` **仅**生产域名 | — |
| **TLS** | 全站 HTTPS；HSTS（Vercel 默认） | — |
| **CSP** | 基础 self | script-src nonce 收紧 |

**自定义 Header（可选 MVP）：** 关键写操作带 `X-Requested-With: Snap1099`。

---

## 9. 密钥、日志、Blob

| 项 | 要求 |
|----|------|
| **Secrets** | `OPENAI_*`, `AUTH_SECRET`, `GHOST_HMAC_SECRET`, `BLOB_*`, Paddle — **仅** Vercel Production/Preview |
| **日志** | **不记录**：原图、完整 AI 响应、Google credential；**可记录**：receipt_id、status、latency、token usage 聚合 |
| **Blob** | **Private**；读用 **短期 signed URL**（≤15min）；Export 包单独 TTL |
| **错误响应** | 不暴露 stack trace / OpenAI 原始错误 |

### 9.1 环境变量（新增）

```
GHOST_HMAC_SECRET=     # Ghost token 签名
RECEIPT_MAX_BYTES=5242880
RECEIPT_GHOST_HOURLY=10
RECEIPT_USER_HOURLY=30
RECEIPT_GHOST_MAX_UNBOUND=50
```

---

## 10. MVP 必做 vs 二期

### 10.1 MVP 必做（P0）

- [ ] `POST /api/ghost/register` + Ghost HMAC Cookie/token
- [ ] 废弃裸信任 `X-Ghost-Id`；Header 仅作校验一致
- [ ] 上传：类型/大小魔数校验 + 归属 + IDOR 404
- [ ] OpenAI 仅服务端；禁止客户端 URL；JSON schema 校验
- [ ] Blob 私有 + signed URL
- [ ] Ghost/User/IP 速率限制 + OpenAI 熔断
- [ ] Session Cookie 安全属性
- [ ] Secrets 不进客户端 / `NEXT_PUBLIC_*`

### 10.2 二期（P1/P2）

- [ ] CSRF token on Delete Account / Export
- [ ] Cloudflare Turnstile on abuse spike
- [ ] 异步队列（QStash）隔离 OpenAI
- [ ] WAF 规则、异常 IP 封禁
- [ ] 安全审计日志、SIEM
- [ ] Replay 防护（idempotency + nonce）

---

## 11. 与产品规范对齐

| PRODUCT-SPEC | 安全设计 |
|--------------|----------|
| 未登录 + 联网可调 OpenAI | 允许，但须 Ghost HMAC + 限流 |
| MVP 美国单区域 | 限流/KV/Blob 均 US 部署 |
| Google 绑定后 Ghost 迁移 | 写权限收口 Session；Ghost token 只读 |
| 离线不调 OpenAI | 客户端不上传；服务端无 offline 入口 |

---

## 12. 实施顺序建议

1. **Ghost register + HMAC middleware**（所有 `/api/receipts*` 前置）
2. **上传校验 + Blob private + ownership**
3. **OpenAI adapter（服务端 only）+ schema**
4. **Rate limit（KV）+ 429 响应**
5. **Session 硬化 + Google 绑定写收口**
6. **日志/Blob/错误响应审查**

---

## 13. 文档索引

| 文档 | 变更 |
|------|------|
| [03-api.md](../../tech/03-api.md) | §3.8 安全摘要 |
| [05-auth-ghost-google.md](../../tech/05-auth-ghost-google.md) | §5.7 扩展 Ghost HMAC |
| [06-receipt-ai-pipeline.md](../../tech/06-receipt-ai-pipeline.md) | §6.9 安全边界 |
| [PRODUCT-SPEC.md](../../product/PRODUCT-SPEC.md) | §2.5 安全铁律 |

**变更流程：** 安全决策 → **本文件** → `docs/tech/` → API 实现 → Agent 规则（可选 `.cursor/rules/snap1099-api-security.mdc`）
