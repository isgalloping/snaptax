import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MARKETING_COPY } from "@/lib/marketing/copy";

describe("marketing hero copy", () => {
  it("matches mockup headline, checklist, and trust strip", () => {
    const { hero } = MARKETING_COPY;

    assert.equal(hero.titleLead, "Keep more of");
    assert.equal(hero.titleHighlight, "what you earn.");
    assert.deepEqual(hero.checklist, [
      "Receipt scanning with AI",
      "IRS Schedule C ready",
      "Export tax reports",
      "Works offline",
    ]);
    assert.equal(
      hero.trustStrip,
      "Secure. Private. Your data is always protected.",
    );
    assert.equal(hero.valueProps.length, 4);
  });
});

describe("MARKETING_HERO_SCREENS", () => {
  it("uses real app screenshots for receipt tracking and export", async () => {
    const { MARKETING_HERO_SCREENS } = await import("@/lib/marketing/heroScreens");
    assert.deepEqual(
      MARKETING_HERO_SCREENS.map((screen) => screen.id),
      ["home", "export"],
    );
    assert.match(MARKETING_HERO_SCREENS[0]?.src ?? "", /hero-app-home\.png$/);
    assert.match(MARKETING_HERO_SCREENS[1]?.src ?? "", /hero-app-export\.png$/);
  });

  it("uses website hero background asset", async () => {
    const {
      MARKETING_HERO_BACKGROUND,
      MARKETING_HERO_BACKGROUND_POSITION,
    } = await import("@/lib/marketing/heroScreens");
    assert.equal(MARKETING_HERO_BACKGROUND, "/photo/website-bg-all.png");
    assert.equal(MARKETING_HERO_BACKGROUND_POSITION, "100% 28%");
  });
});
