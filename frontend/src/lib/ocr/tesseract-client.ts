"use client";
import Tesseract from "tesseract.js";
import type { OcrProvider, OcrResult, OcrInput } from "./provider";

/** Client-side fallback. Keeps the default first pass for normal images and
 * tries at most two alternative segmentations when its result is weak.
 * Segmentation helps irregular layouts; it does not geometrically dewarp text.
 * A worker is reused per request and always terminated. Model assets may need
 * a download on first use, even though recognition itself runs locally.
 */
export function createTesseractProvider(): OcrProvider {
  return {
    name: "tesseract.js",
    async recognize(input: OcrInput): Promise<OcrResult> {
      const src = input.kind === "url" ? input.url : `data:${input.mimeType};base64,${input.data}`;
      const worker = await Tesseract.createWorker("eng");
      try {
        // Preserve the engine's existing default segmentation on the first pass.
        let { data } = await worker.recognize(src);
        function score(candidate: typeof data): number {
          const text = (candidate.text || "").trim();
          const characters = (text.match(/[a-z0-9]/gi) || []).length;
          if (!characters) return 0;
          const confidence = Number.isFinite(candidate.confidence)
            ? Math.min(100, Math.max(0, candidate.confidence)) : 0;
          const meaningfulRatio = characters / Math.max(1, text.replace(/\s/g, "").length);
          // Bound the length contribution so long low-confidence noise cannot
          // beat shorter, credible text. This is a heuristic, not ground truth.
          return confidence * meaningfulRatio * (0.75 + 0.25 * Math.min(1, characters / 20));
        }
        let bestScore = score(data);
        if (bestScore < 75) {
          for (const mode of [Tesseract.PSM.SPARSE_TEXT, Tesseract.PSM.AUTO]) {
            try {
              await worker.setParameters({ tessedit_pageseg_mode: mode });
              const candidate = (await worker.recognize(src)).data;
              const candidateScore = score(candidate);
              if (candidateScore > bestScore) {
                data = candidate;
                bestScore = candidateScore;
              }
            } catch {
              // Optional retries must not discard a usable initial result.
            }
          }
        }
        const words = (data.words || []).map((w) => ({
          text: w.text,
          bbox: { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 },
          confidence: w.confidence,
        }));
        return { text: data.text || "", words, lines: [], provider: "tesseract.js" };
      } finally {
        // Cleanup failure should not mask recognition results or original errors.
        await worker.terminate().catch(() => undefined);
      }
    },
  };
}
