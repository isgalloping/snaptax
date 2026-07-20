# 13 — PWA 安装与路由架构

> **Agent 必读** — 改 `components/pwa/`、`lib/pwa/`、`app/manifest.ts`、营销 CTA 前读本文（canonical；历史 ADR 见 §7 archive）。

---

## 1. 站点拆分（Marketing vs Product）

| 区域 | 路由 | Layout | Serwist SW | PWA manifest scope |
|------|------|--------|------------|-------------------|
| **营销站** | `/`, `/pricing`, `/blog/*`, `/help` … | `app/(marketing)/layout.tsx` | ❌ 不注册 | 不在 scope 内 |
| **产品 PWA** | `/app` | `app/(pwa)/app/layout.tsx` → `PwaProvider` | ✅ `/serwist/sw.js` | `start_url` + `scope` = **`/app`** |

- 生产域名示例：`https://snaptax.lightxforge.com`
- 产品入口常量：`lib/marketing/pwaEntryRedirect.ts` → `PWA_APP_ENTRY = "/app"`
- 营销 CTA：**原生 `<a href="/app">`**（Android Chrome WebAPK link capture）；见 `components/marketing/MarketingAppLink.tsx`

---

## 2. Manifest 与桌面图标名

**文件：** `app/manifest.ts`

| 字段 | 当前值 | 说明 |
|------|--------|------|
| `name` / `short_name` | **SnapTax** | 主屏幕图标下显示名（2026-07-06 起） |
| `id` | `/app` | 与 scope 一致 |
| `start_url` | `/app` | standalone 启动 URL |
| `scope` | `/app` | 仅 `/app` 内页面属 PWA |
| `capture_links` | `existing-client-navigate` | 站外/浏览器内链接触发 WebAPK |
| `launch_handler.client_mode` | `navigate-existing` | 复用已开 PWA 窗口 |

**iOS A2HS 标题：** `app/layout.tsx` → `appleWebApp.title` = **SnapTax**

**品牌 vs 安装名：**

- **安装图标 / manifest：** SnapTax  
- **应用内 i18n 产品文案：** 仍多为 Snap1099（品牌不强制全改）  
- **内部 storage 前缀：** 仍为 `snap1099_*`（Cookie、PWA sticky、`__snap1099*` 等）— **勿与安装名混淆**

**已安装用户改图标名：** OS 不会自动更新；需重装或重新「添加到主屏幕」。

---

## 3. 安装 UI 分层

```
app/layout.tsx                    InstallCaptureScript（全站捕获 beforeinstallprompt）
├── (marketing)/layout.tsx        MarketingInstallShell → PwaInstallProvider(requireLandingDone=false)
│                                 MarketingInstallButton + InstallPrompt bar
└── (pwa)/app/layout.tsx          PwaProvider → Serwist + PwaInstallProvider + AppBrowserEntryGate
```

| 组件 | 职责 |
|------|------|
| `InstallCaptureScript` | 根 layout 注入；`lib/pwa/installCaptureScript.ts` |
| `PwaInstallProvider` | install bar / header 按钮 / manual sheet / WebApk guide |
| `AppBrowserEntryGate` | **仅 `/app`**；Landing 后全屏门控（Android Chrome + iOS Safari） |
| `MarketingInstallShell` | 营销页轻量安装；无 `LaunchFromHomeHint` |
| `LaunchFromHomeHint` | Android Chrome 已装但仍在浏览器 Tab 的底栏提示 |
| `MarketingAppLink` | Get Started → `/app`；非 WebAPK 平台弹「从主屏幕打开」 |

---

## 4. `/app` 手机浏览器入口门控（AppBrowserEntryGate）

**纯逻辑：** `lib/pwa/appBrowserEntry.ts`  
**UI：** `components/pwa/AppBrowserEntryGate.tsx`

### 4.1 触发条件（全部满足）

1. `pathname` 以 `/app` 开头  
2. 非 standalone（`display-mode: standalone` / iOS `navigator.standalone`）  
3. 平台：**Android Chrome WebAPK**（`isAndroidChromeWebApkBrowser`）或 **`ios-safari`**（含 iPad）  
4. Landing 已完成（`html.landing-done` 或 session `snap1099_landing_done`）  
5. 本 session 未 dismiss（`sessionStorage.snaptax_app_entry_gate_dismissed`）

### 4.2 状态机

| 状态 | 主 CTA | 次要 |
|------|--------|------|
| 未安装 | Install SnapTax | Continue in browser |
| manual（iOS / Android 无 prompt） | Added to Home Screen | Continue in browser |
| post-install | Got it（SnapTax 引导步骤） | — |
| 已安装 | Open SnapTax → `openPwaAppEntry()` | Continue in browser |

### 4.3 Session 协调

| 行为 | 效果 |
|------|------|
| Continue in browser / post-install Got it | `dismissAppEntryGate()` + 事件 `snap1099:app-entry-gate-dismissed` |
| Skip 后 | 本 session **不**再弹全屏门控；**隐藏**底栏 install bar；**保留** TaxHeader install 按钮 |
| 门控 overlay 显示中 | `PwaProvider` 传 `suppressWebApkGuide` + `suppressInstallBar` 给 provider |

### 4.4 产品铁律例外

全屏门控是 **§2.1「核心拍照零 Modal」的已批准例外** — 仅手机浏览器访问 **`/app`**、且 Landing 之后；**必须可跳过**（Continue in browser）。营销页 **无**全屏门控。

---

## 5. 平台能力矩阵

| 平台 | 全屏门控 | native `beforeinstallprompt` | WebAPK link capture | 已装 → 静默开 PWA |
|------|----------|------------------------------|---------------------|-------------------|
| Android Chrome | ✅ | ✅ | ✅（用户手势导航） | ❌ 须点 Open SnapTax |
| Android Edge/Opera/Firefox | ❌ bar only | 部分 / 无 | ❌ | ❌ |
| iOS/iPad Safari | ✅ | ❌ manual A2HS | ❌ | ❌ 仅文案引导 |
| Desktop Chromium | ❌ | ✅ | N/A | N/A |

**营销 Get Started：** Android Chrome 不 intercept（`lib/marketing/shouldInterceptMarketingAppNavigation.ts`）；Safari / Android 非 Chrome 已装时 intercept 并提示从主屏幕打开。

---

## 6. 关键文件索引

| 路径 | 用途 |
|------|------|
| `app/manifest.ts` | PWA manifest |
| `app/layout.tsx` | 根 metadata、`InstallCaptureScript` |
| `app/(pwa)/app/layout.tsx` | `PwaProvider` 挂载点 |
| `components/pwa/PwaProvider.tsx` | Serwist + install provider + entry gate |
| `components/pwa/AppBrowserEntryGate.tsx` | 全屏门控 UI |
| `components/pwa/PwaInstallProvider.tsx` | install 状态机 |
| `lib/pwa/appBrowserEntry.ts` | 门控 eligibility |
| `lib/pwa/deferredInstall.ts` | prompt 捕获、landing-done、install bar dismiss |
| `lib/pwa/installedDetect.ts` | `getInstalledRelatedApps` + sticky `snap1099_pwa_installed` |
| `lib/pwa/installPlatform.ts` | UA 平台检测 |
| `lib/marketing/openPwaAppEntry.ts` | `location.assign('/app')`（须用户手势） |
| `lib/marketing/MarketingAppLink.tsx` | 营销 CTA |

---

## 7. 相关 ADR / Spec

| 文档 | 主题 |
|------|------|
| [2026-07-06-pwa-snaptax-label-app-entry-gate-design.md](../superpowers/archive/specs/2026-07-06-pwa-snaptax-label-app-entry-gate-design.md) | SnapTax 标签 + 门控（archived） |
| [2026-06-10-pwa-install-prompt-design.md](../superpowers/archive/specs/2026-06-10-pwa-install-prompt-design.md) | install bar / landing 门控（archived） |
| [2026-06-10-pwa-cross-context-installed-design.md](../superpowers/archive/specs/2026-06-10-pwa-cross-context-installed-design.md) | 跨 Tab 已装检测（archived） |
| [2026-06-19-android-webapk-hyperos-launch-design.md](../superpowers/specs/2026-06-19-android-webapk-hyperos-launch-design.md) | WebAPK / HyperOS Chrome 权限（active ADR） |

---

## 8. Agent 改 PWA 时检查清单

- [ ] 营销 `/` 与产品 `/app` 行为是否分开？  
- [ ] Android Chrome CTA 是否仍用原生 `<a href="/app">`（非 `preventDefault` + client router）？  
- [ ] 门控是否 **Landing 之后**、且 **可跳过**？  
- [ ] 门控 active 时是否避免 **双份** install bar + WebApk post-install sheet？  
- [ ] 改 manifest `short_name` 时是否同步 `appleWebApp.title`？  
- [ ] 单测：`lib/pwa/appBrowserEntry.test.ts`；全量 `npm run test:unit`
