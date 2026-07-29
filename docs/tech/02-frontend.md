# 02 — 前端架构

## 2.1 技术栈

- Next.js 16 App Router · React 19 · TypeScript · Tailwind 4
- Serwist PWA（`app/sw.ts`, `@serwist/turbopack`）
- IndexedDB（`lib/storage/receiptDb.ts`；object store **`snaptax_*`**，见 [DB-DESIGN-SPEC.md](./DB-DESIGN-SPEC.md) §2.2）

## 2.2 页面与组件

| 逻辑页 | 路由 | 组件入口 |
|--------|------|----------|
| **营销站** | `/`, `/pricing`, `/help` … | `app/(marketing)/` · `components/marketing/` |
| **产品 PWA** | **`/app`** | `app/(pwa)/app/page.tsx` → `StartupShell` / `HomeScreen` |
| 设置/导出 | 同 `/app` SPA 状态 `view=settings` | `components/settings/SettingsScreen.tsx` |

> PRD 要求 2 **逻辑页**（主界面 + 设置）；路由上营销与产品已拆分，**拍照主界面仅在 `/app`**。

## 2.2.1 PWA 安装架构

**Canonical：** [13-pwa-install-architecture.md](./13-pwa-install-architecture.md)

- Manifest：`short_name` **SnapTax** · `scope`/`start_url` **`/app`**
- 根 layout：`InstallCaptureScript`（全站捕获 install prompt）
- 营销：`MarketingInstallShell`（轻量 bar + header）
- 产品：`AppBrowserEntryGate`（Landing 后全屏门控，可跳过）
- 营销 CTA：`MarketingAppLink` 原生 `<a href="/app">`（Android WebAPK）

## 2.3 客户端状态

```
HomeScreen
├── receipts[]        ← IndexedDB + API sync
├── taxSaved          ← 派生或 API
├── ghostSession      ← Cookie snap1099_ghost（POST /api/ghost/register）
├── authUser          ← Google session（snap1099_session）
├── entitlements      ← 本季 Paddle 权益
├── softBannerDismissed
└── view: home | settings
```

## 2.4 离线策略

| 操作 | 离线 | 在线 |
|------|------|------|
| 打开主界面 | SW 缓存 `/` | 正常 |
| 拍照 | getUserMedia → **压缩 1280×960/q75** → OPFS + IDB meta | + 上传 API |
| 列表展示 | IndexedDB 本地 | merge API |
| AI 分类 | 本地 OCR + 队列（离线可跑 Worker） | upload → Path A 文本分类 / Path B Vision |
| Google 登录 | 不可用 | OAuth |
| Paddle 支付 | 不可用 | Overlay |
| 导出 | 不可用 | API |

### Sync Worker（目标实现）

1. `online` 事件 → `syncPendingReceipts()`
2. 每条：若 `localOnly` → `POST /api/receipts` → 更新 `serverId`
3. 失败 → 指数退避，UI 仍显示 Processing

### 本地图片（OPFS）

- IDB **`snaptax_receipt_photos`** 仅存元数据；full/thumb 密文在 **OPFS**（见 [12-local-image-storage-design.md](./12-local-image-storage-design.md)）
- 拍照压缩：4032×3024 量级 → **1280×960 内、JPEG 75%、200～300KB**
- 已同步 **≥90 天**：idle 任务删 OPFS 原图，保留缩略图；详情无 full 时走 signed URL

## 2.5 PWA 要求

- `app/manifest.ts`：standalone, portrait, theme `#000000`, **`short_name`: SnapTax**, **`scope`/`start_url`: `/app`**
- SW（Serwist）：**仅 `/app` 产品路由** 经 `PwaProvider` 注册 `/serwist/sw.js`
- SW 预缓存：`/app` + static chunks（见 `app/serwist/[path]/route.ts`）
- **API 写操作：** `app/sw.ts` 在 `defaultCache` 前注册 `POST/PUT/PATCH/DELETE` → `/api/*` 的 `NetworkOnly`
- 安装 UI：见 [13-pwa-install-architecture.md](./13-pwa-install-architecture.md)（`InstallPrompt` · `AppBrowserEntryGate` · 营销 shell）

## 2.6 UI 约束（摘自 PRODUCT-SPEC）

- 配色 #000 / #fff / #EAB308
- 热区 ≥ 64px，快门 > 96px
- 核心拍照 **零 Modal**
- 登录/Paywall 用 **底部滑出面板**

## 2.7 本地 OCR 调试（桌面）

客户端 OCR 在 `lib/ocr/` + `lib/workers/ocrWorker.ts`；`HomeScreen` 启动时 `preloadOcrEngine()` 预热 Worker。

桌面开发可选 env（**须重启 dev**）：

```bash
NEXT_PUBLIC_SKIP_LOCAL_OCR=1    # 跳过 Worker OCR → 仅服务端 Vision
NEXT_PUBLIC_OCR_MAX_EDGE=960    # 或缩小 OCR 输入
```

详见 [11-ocr-pipeline-design.md §10.1](./11-ocr-pipeline-design.md#101-本地桌面调试推荐写入-envlocal)。

## 2.8 第三方 Client SDK

| SDK | 用途 |
|-----|------|
| Google Identity Services | `Continue with Google` 按钮 |
| `@paddle/paddle-js` | Overlay checkout |

## 2.9 目录结构（目标）

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
