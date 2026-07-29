import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { US_EXPORT_CATEGORIES } from "@/lib/tax/usExportCategories";
import { EU_CLASSIFY_PROMPT } from "./euClassify.ts";
import { EU_RECEIPT_PROMPT } from "./euReceipt.ts";
import { US_CLASSIFY_PROMPT } from "./usClassify.ts";
import { US_RECEIPT_PROMPT } from "./usReceipt.ts";

describe("OpenAI receipt prompts", () => {
  for (const category of US_EXPORT_CATEGORIES) {
    it(`US receipt prompt lists category ${category}`, () => {
      assert.match(US_RECEIPT_PROMPT, new RegExp(category));
    });
  }

  it("Vision prompts require a single merchant name", () => {
    for (const prompt of [US_RECEIPT_PROMPT, EU_RECEIPT_PROMPT]) {
      assert.match(prompt, /ONE store/);
      assert.match(prompt, /never combine multiple names/);
    }
  });

  it("Classify prompts guard multi-receipt OCR text", () => {
    for (const prompt of [US_CLASSIFY_PROMPT, EU_CLASSIFY_PROMPT]) {
      assert.match(prompt, /raw_text/);
      assert.match(prompt, /confidence below 0\.5/);
    }
  });

  it("US prompts document MEALS 50% deduction", () => {
    assert.match(US_RECEIPT_PROMPT, /MEALS.*0\.5/s);
    assert.match(US_CLASSIFY_PROMPT, /MEALS.*0\.5/s);
  });

  it("does not duplicate EU_CLASSIFY_PROMPT in usClassify.ts", () => {
    const src = readFileSync("lib/openai/prompts/usClassify.ts", "utf8");
    assert.doesNotMatch(src, /export const EU_CLASSIFY_PROMPT/);
  });
});
