/** Local OCR pipeline types — Phase 1 */

export type LocalOcrEngine = "onnx" | "tesseract" | "skipped";

export type LocalOcrResult = {
  text: string;
  confidence: number;
  engine: LocalOcrEngine;
  durationMs: number;
};

export type ParsedReceiptSignals = {
  merchantMissing: boolean;
  totalMissing: boolean;
  garbleRatio: number;
};

export type ParsedReceiptDraft = {
  merchant?: string;
  date?: string;
  total?: number;
  tax?: number;
  rawText: string;
  signals: ParsedReceiptSignals;
};

export type OcrDraftPayload = {
  text: string;
  confidence: number;
  parsed: ParsedReceiptDraft;
  engine: LocalOcrEngine;
  preprocessVersion: 1 | 2;
};

export type StructuredReceipt = {
  merchant: string;
  date?: string;
  total: number;
  tax?: number;
  rawText: string;
  extractionSource: "local_ocr" | "vision_fallback";
};

export type ExtractionSource = StructuredReceipt["extractionSource"];
