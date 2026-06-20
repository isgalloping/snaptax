/**
 * 验证 PWA 离线启动与拍照：需先 npm run build && npm start
 * 运行: node scripts/verify-offline.mjs [port]
 */
import { chromium } from "playwright";

const port = process.argv[2] ?? "3000";
const BASE = `http://localhost:${port}`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    permissions: ["camera"],
  });

  await context.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#EAB308";
        ctx.fillRect(0, 0, 640, 480);
      }
      return canvas.captureStream(30);
    };
  });

  const page = await context.newPage();
  const results = [];

  try {
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);

    const swActive = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      await navigator.serviceWorker.ready;
      return true;
    });
    results.push({ check: "Service Worker 已激活", pass: swActive });

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(3000);

    const bodyText = await page.locator("body").innerText();
    const snapVisible = bodyText.includes("SNAP RECEIPT");
    const offlinePage = bodyText.includes("You're offline");
    results.push({
      check: "离线刷新后显示主界面（SNAP RECEIPT）",
      pass: snapVisible && !offlinePage,
    });
    results.push({
      check: "离线刷新未落到 /offline  fallback 页",
      pass: !offlinePage,
    });
    results.push({
      check: "离线状态指示器显示 Ready / Offline",
      pass: bodyText.includes("Ready / Offline"),
    });

    if (snapVisible) {
      await page.getByRole("button", { name: "SNAP RECEIPT" }).click();
      await page.waitForTimeout(800);

      const cameraUi = await page
        .locator("body")
        .innerText()
        .then((t) => t.includes("< BACK") || t.includes("Opening camera"));
      results.push({
        check: "离线可打开相机界面",
        pass: cameraUi,
      });

      const shutter = page.getByRole("button", { name: "Take photo" });
      await page.waitForTimeout(1500);
      if (await shutter.isVisible().catch(() => false)) {
        await shutter.click();
        await page.waitForTimeout(1500);

        const afterSnap = await page.locator("body").innerText();
        results.push({
          check: "离线拍照后回到主界面",
          pass: afterSnap.includes("SNAP RECEIPT") && afterSnap.includes("Processing"),
        });
        results.push({
          check: "离线拍照后显示 Processing 队列",
          pass: afterSnap.includes("Processing"),
        });
      }

      const photoStored = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const req = indexedDB.open("snaptax", 1);
          req.onerror = () => resolve(false);
          req.onsuccess = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains("photos")) {
              resolve(false);
              return;
            }
            const tx = db.transaction("photos", "readonly");
            const getAll = tx.objectStore("photos").getAll();
            getAll.onsuccess = () => resolve((getAll.result?.length ?? 0) > 0);
            getAll.onerror = () => resolve(false);
          };
        });
      });
      results.push({
        check: "离线拍照照片已写入 IndexedDB",
        pass: photoStored,
      });
    }
  } catch (err) {
    results.push({
      check: "测试执行",
      pass: false,
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    await context.setOffline(false);
    await browser.close();
  }

  console.log("\n=== Snap1099 离线功能检查 ===\n");
  let allPass = true;
  for (const r of results) {
    const icon = r.pass ? "✓" : "✗";
    console.log(`${icon} ${r.check}`);
    if ("error" in r && r.error) console.log(`  错误: ${r.error}`);
    if (!r.pass) allPass = false;
  }
  console.log(allPass ? "\n全部通过\n" : "\n存在未通过项\n");
  process.exit(allPass ? 0 : 1);
}

main();
