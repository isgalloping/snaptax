/**
 * WCAG baseline audit for core routes. Requires dev server on A11Y_BASE_URL.
 * Usage: npm run dev &  npm run a11y:audit
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const base = process.env.A11Y_BASE_URL ?? "http://localhost:3000";

function summarize(results) {
  const violations = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    help: v.help,
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
  }));
}

async function audit(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  const issues = summarize(results);
  console.log(`\n=== ${label} ===`);
  console.log(
    `violations: ${results.violations.length} (critical/serious: ${issues.length})`,
  );
  for (const issue of issues) {
    console.log(`  [${issue.impact}] ${issue.id}: ${issue.help} (${issue.nodes} nodes)`);
    for (const t of issue.targets) console.log(`    - ${t}`);
  }
  return { label, issues, total: results.violations.length };
}

async function waitForHome(page) {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector('button:has-text("Snap Receipt"), button:has-text("SNAP RECEIPT")', {
    timeout: 90_000,
  });
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const reports = [];

  try {
    await waitForHome(page);
    reports.push(await audit(page, "Home (/)"));

    const settingsBtn = page.getByRole("button", { name: /settings/i }).first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
      reports.push(await audit(page, "Settings overlay"));
    }
  } finally {
    await browser.close();
  }

  const criticalSerious = reports.reduce((n, r) => n + r.issues.length, 0);
  console.log(`\nDone. Critical/serious across paths: ${criticalSerious}`);
  process.exit(criticalSerious > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
