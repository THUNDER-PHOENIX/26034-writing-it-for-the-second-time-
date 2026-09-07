/**
 * OCR provider abstraction.
 *
 * The frontend (and the /api/ocr server route) only ever talk to this
 * interface, so we can swap OCR.space ↔ Google Vision ↔ Tesseract.js without
 * touching call-sites.
 *
 * All providers return the same shape:
 *   {
 *     text: string;                       // full recognized text (line-broken)
 *     words: { text, bbox, confidence }[];// per-word with bounding boxes
 *     lines: { text, bbox }[];            // per-line with bounding boxes
 *     provider: string;                   // which provider actually ran
 *   }
 *
 * bbox is in pixels in the image's own coordinate space, top-left origin:
 *   { x0, y0, x1, y1 }
 */

export interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  confidence: number;
}

export interface OcrLine {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface OcrResult {
  text: string;
  words: OcrWord[];
  lines: OcrLine[];
  provider: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface OcrProvider {
  readonly name: string;
  recognize(input: OcrInput): Promise<OcrResult>;
}

/** Either a URL (for cloud OCR), a data URL, or a base64 string. */
export type OcrInput =
  | { kind: "url"; url: string }
  | { kind: "base64"; data: string; mimeType: string };
