import type { OcrInput, OcrProvider, OcrResult, OcrLine, OcrWord } from "./provider";

/**
 * OCR.space provider.
 *
 * Free tier: 25,000 requests/month, no credit card.
 * Sign up at https://ocr.space/ocrapi to get an API key.
 *
 * Set env var OCR_SPACE_API_KEY. The 'helloworld' key is a public demo key
 * that works for light usage but rate-limits aggressively — use your own.
 *
 * Server-side only — never expose the API key to the browser.
 */

interface OcrSpaceParsedResult {
  ParsedText: string;
  TextOverlay?: {
    Lines?: Array<{
      LineText: string;
      Words?: Array<{
        WordText: string;
        Left: number;
        Top: number;
        Width: number;
        Height: number;
        Confidence?: number;
      }>;
    }>;
  };
  FileSize?: number;
  ErrorMessage?: string;
}

interface OcrSpaceResponse {
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string | string[];
  ErrorDetails?: string;
  ParsedResults?: OcrSpaceParsedResult[];
}

const OCR_SPACE_URL = "https://api.ocr.space/parse/image";

export function createOcrSpaceProvider(apiKey: string): OcrProvider {
  return {
    name: "ocrspace",
    async recognize(input: OcrInput): Promise<OcrResult> {
      const form = new FormData();
      form.append("apikey", apiKey);
      form.append("language", "eng");
      form.append("isOverlayRequired", "true");
      form.append("OCREngine", "2"); // Engine 2 is better for noisy photos
      form.append("scale", "true");
      form.append("detectOrientation", "true");
      form.append("isTable", "false");

      if (input.kind === "url") {
        form.append("url", input.url);
      } else {
        // OCR.space accepts a base64 string in the 'base64Image' field.
        form.append("base64Image", `data:${input.mimeType};base64,${input.data}`);
      }

      const resp = await fetch(OCR_SPACE_URL, {
        method: "POST",
        body: form,
      });
      if (!resp.ok) {
        throw new Error(`OCR.space HTTP ${resp.status}: ${await resp.text().catch(() => "")}`);
      }
      const json = (await resp.json()) as OcrSpaceResponse;

      if (json.IsErroredOnProcessing || json.OCRExitCode !== 1) {
        const msg = Array.isArray(json.ErrorMessage)
          ? json.ErrorMessage.join("; ")
          : json.ErrorMessage || json.ErrorDetails || "Unknown OCR.space error";
        throw new Error(`OCR.space: ${msg}`);
      }
      const first = json.ParsedResults?.[0];
      if (!first) {
        throw new Error("OCR.space returned no parsed results");
      }

      const lines: OcrLine[] = [];
      const words: OcrWord[] = [];
      const rawLines = first.TextOverlay?.Lines ?? [];
      for (const ln of rawLines) {
        if (!ln.Words || ln.Words.length === 0) continue;
        const lx0 = Math.min(...ln.Words.map((w) => w.Left));
        const ly0 = Math.min(...ln.Words.map((w) => w.Top));
        const lx1 = Math.max(...ln.Words.map((w) => w.Left + w.Width));
        const ly1 = Math.max(...ln.Words.map((w) => w.Top + w.Height));
        lines.push({ text: ln.LineText, bbox: { x0: lx0, y0: ly0, x1: lx1, y1: ly1 } });
        for (const w of ln.Words) {
          words.push({
            text: w.WordText,
            bbox: { x0: w.Left, y0: w.Top, x1: w.Left + w.Width, y1: w.Top + w.Height },
            confidence: typeof w.Confidence === "number" ? w.Confidence : 0,
          });
        }
      }

      return {
        text: first.ParsedText ?? "",
        words,
        lines,
        provider: "ocrspace",
      };
    },
  };
}
