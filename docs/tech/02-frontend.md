# 02 — 前端架构

## 2.1 技术栈

- Next.js 16 App Router · React 19 · TypeScript · Tailwind 4
- Serwist PWA（`app/sw.ts`, `@serwist/turbopack`）
- IndexedDB（`lib/storage/receiptDb.ts`）

## 2.2 页面与组件

| 逻辑页 | 路由 | 组件入口 |
|--------|------|----------|
| 主界面 | `/` | `components/home/HomeScreen.tsx` |
| 设置/导出 | 同 SPA 状态 `view=settings` | `components/settings/SettingsScreen.tsx` |

> PRD 要求 2 逻辑页；实现为单路由 + 客户端 view 切换，避免多余 SSR 导航。

## 2.3 客户端状态

```
HomeScreen
├── receipts[]        ← IndexedDB + API sync
├── taxSaved          ← 派生或 API
├── ghostId           ← localStorage
├── authUser          ← Google session context
├── entitlements      ← 本季 Paddle 权益
├── softBannerDismissed
└── view: home | settings
```

## 2.4 离线策略

| 操作 | 离线 | 在线 |
|------|------|------|
| 打开主界面 | SW 缓存 `/` | 正常 |
| 拍照 | getUserMedia + IndexedDB | + 上传 API |
| 列表展示 | IndexedDB 本地 | merge API |
| AI 分类 | 保持 `processing` | 轮询至 done/blurry |
| Google 登录 | 不可用 | OAuth |
| Paddle 支付 | 不可用 | Overlay |
| 导出 | 不可用 | API |

### Sync Worker（目标实现）

1. `online` 事件 → `syncPendingReceipts()`
2. 每条：若 `localOnly` → `POST /api/receipts` → 更新 `serverId`
3. 失败 → 指数退避，UI 仍显示 Processing

## 2.5 PWA 要求

- `app/manifest.ts`：standalone, portrait, theme `#000000`
- SW 预缓存：`/` + static chunks（见 `app/serwist/[path]/route.ts`）
- 安装提示：`components/pwa/InstallPrompt.tsx`

## 2.6 UI 约束（摘自 PRODUCT-SPEC）

- 配色 #000 / #fff / #EAB308
- 热区 ≥ 64px，快门 > 96px
- 核心拍照 **零 Modal**
- 登录/Paywall 用 **底部滑出面板**

## 2.7 第三方 Client SDK

| SDK | 用途 |
|-----|------|
| Google Identity Services | `Continue with Google` 按钮 |
| `@paddle/paddle-js` | Overlay checkout |

## 2.8 目录结构（目标）

```
components/
├── home/          # 主界面
├── settings/      # 设置/导出
├── camera/        # 相机 overlay
├── auth/          # Google 面板、软引导横条
├── billing/       # Paddle paywall
└── pwa/
lib/
├── client/        # ghost, sync, auth context
├── prisma.ts      # PrismaClient 单例
├── server/        # 业务逻辑（通过 prisma 访问 DB）
└── storage/       # receiptDb (IndexedDB)
prisma/
├── schema.prisma
└── migrations/
```
