import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { shouldSkipLocalOcr } from "@/lib/ocr/runLocalOcr";

describe("shouldSkipLocalOcr", () => {
  const prev = process.env.NEXT_PUBLIC_SKIP_LOCAL_OCR;

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SKIP_LOCAL_OCR;
    else process.env.NEXT_PUBLIC_SKIP_LOCAL_OCR = prev;
  });

  it("skips when NEXT_PUBLIC_SKIP_LOCAL_OCR=1", () => {
    process.env.NEXT_PUBLIC_SKIP_LOCAL_OCR = "1";
    assert.equal(shouldSkipLocalOcr(), true);
  });
});
