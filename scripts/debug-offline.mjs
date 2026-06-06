import { chromium } from "playwright";

const BASE = "http://localhost:3460";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

await context.setOffline(true);
const response = await page.reload({ waitUntil: "domcontentloaded" });
console.log("offline reload status:", response?.status());
console.log("offline url:", page.url());
console.log("body text:", (await page.locator("body").innerText()).slice(0, 500));

const cacheKeys = await page.evaluate(async () => {
  const keys = await caches.keys();
  const result = [];
  for (const key of keys) {
    const cache = await caches.open(key);
    const reqs = await cache.keys();
    result.push({ cache: key, urls: reqs.map((r) => r.url).slice(0, 30) });
  }
  return result;
});
console.log("caches:", JSON.stringify(cacheKeys, null, 2));

await browser.close();
