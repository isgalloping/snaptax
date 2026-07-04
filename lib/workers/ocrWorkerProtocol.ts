import type { LocalOcrResult, OcrDraftPayload } from "@/lib/ocr/types";

export type OcrWorkerRequest =
  | { kind: "preload" }
  | {
      kind: "run";
      receiptId: string;
      imageBlob: Blob;
    };

export type OcrWorkerResponse =
  | { kind: "ok"; receiptId: string; draft: OcrDraftPayload; durationMs: number }
  | { kind: "err"; receiptId: string; reason: string }
  | { kind: "preloaded" };

export type OcrWorkerRunResult = {
  draft: OcrDraftPayload;
  durationMs: number;
  ocr: LocalOcrResult;
};
