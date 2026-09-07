"use client";
import Tesseract from "tesseract.js";
import type { OcrProvider, OcrResult, OcrInput } from "./provider";

/**
 * Client-side Tesseract.js provider.
 *
 * Used as a fallback when /api/ocr is not reachable (no API key, offline,
 * server cold-start failed). Runs the OCR engine in the browser via WebAssembly.
 *
 * No network needed but slower and less accurate on real-world product photos
 * than a cloud OCR engine with image preprocessing.
 */
export function createTesseractProvider(): OcrProvider {
  return {
    name: "tesseract.js",
    async recognize(input: OcrInput): Promise<OcrResult> {
      const src = input.kind === "url" ? input.url : `data:${input.mimeType};base64,${input.data}`;
      const { data } = await Tesseract.recognize(src, "eng", {});
      const words = (data.words || []).map((w) => ({
        text: w.text,
        bbox: { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 },
        confidence: w.confidence,
      }));
      return {
        text: data.text || "",
        words,
        lines: [],
        provider: "tesseract.js",
      };
    },
  };
}
