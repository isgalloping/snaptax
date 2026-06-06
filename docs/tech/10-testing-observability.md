# 10 — 测试与可观测性

## 10.1 测试金字塔

| 层 | 工具 | 范围 |
|----|------|------|
| E2E | Playwright | 离线启动、拍照、UI 三态 |
| API | Vitest + fetch | Route Handlers mock **Prisma**（`prisma mock` 或 test container）/ OpenAI |
| 单元 | Vitest | lib/server 纯函数 |

已有：`scripts/verify-offline.mjs`（离线 PWA）

## 10.2 关键 E2E 用例

1. Ghost 启动 → 拍照 → Processing 卡片
2. 软引导出现 /  dismiss 不再出现
3. Export 硬拦截 Google
4. Paddle Sandbox 支付 → Export Again
5. 离线拍照 → IndexedDB → 联网 sync

## 10.3 API 测试要点

- Google JWT 验证 mock
- Ghost 绑定幂等
- Paddle webhook 签名 + 重复事件
- OpenAI response 解析 → status 映射
- 402 未付费导出

## 10.4 KPI 埋点（对应 PRD §4）

| KPI | 事件 |
|-----|------|
| 首屏 ≤1.5s | `perf_first_snap_ready` (Web Vitals) |
| 拍照放弃率 | `camera_open` / `camera_capture` |
| Google 绑定率 | `google_bind_success` / ghost users |
| Paywall 转化 | `paywall_view` / `paddle_checkout_complete` |

实现：Vercel Analytics custom events 或 PostHog（MVP 二选一）。

## 10.5 日志

> **Canonical：** [2026-06-06-logging-design.md](../superpowers/specs/2026-06-06-logging-design.md) · Rule：`.cursor/rules/snap1099-logging.mdc`

- **单行 key=value** 结构化 `LogEntry`（API `api.*` + 业务 `biz.*` 同一字段集；**非 JSON**）
- **必填：** `module`, `success`, `durationMs`, `ts`；身份：`userId`, `ghostId`, `email`（脱敏）, `authChannel`
- **禁止：** 小票图片、密钥、JWT/Cookie 全文、完整 AI 响应、生产 stack trace
- 输出：Vercel Runtime Logs；路线图 Log Drain → Axiom
- Route Handler 使用 `withRequestLog`（实施见 [logging plan](../superpowers/plans/2026-06-06-logging.md)）

## 10.6 告警（生产）

- OpenAI 错误率 > 5%
- Paddle webhook 失败
- API 5xx rate
- Postgres 连接失败

## 10.7 安全测试

- Webhook 无签名 → 401
- 跨用户访问 receipt → 403
- Blob URL 未授权访问 → 403

## 10.8 发布前检查清单

- [ ] Production env 全部设置
- [ ] `prisma migrate deploy` 已在 Production 执行
- [ ] Paddle live / Google OAuth production 凭据
- [ ] SW precache `/` 验证
- [ ] `verify-offline.mjs` 通过
- [ ] Sandbox 端到端支付 + 导出
