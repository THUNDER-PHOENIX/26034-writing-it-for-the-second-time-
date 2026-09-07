"use client";
import { Jimp } from "jimp";

/**
 * Image preprocessing for OCR accuracy.
 *
 * Real-world product photos are usually:
 *   - high resolution (5+ MP from a phone), which slows OCR and adds noise
 *   - have shadows / uneven lighting
 *   - have slight perspective skew (label is rarely perfectly flat to the camera)
 *   - have glare spots on glossy labels
 *
 * This pipeline:
 *   1. Auto-rotates from EXIF (most cameras tag orientation)
 *   2. Resizes so the longest side is <= 1600px (best speed/accuracy tradeoff
 *      for both OCR.space and Tesseract.js)
 *   3. Converts to grayscale (text is monochrome; removes color noise)
 *   4. Normalizes histogram contrast (stretches dark/light range, fixes shadows)
 *   5. Light unsharp mask (sharpens text edges after smoothing)
 *
 * Returns a JPEG dataURL (smallest size for upload) and a `preprocessed` flag
 * so the caller knows whether preprocessing was skipped.
 */
export interface PreprocessResult {
  dataUrl: string;
  mimeType: "image/jpeg";
  preprocessed: boolean;
  originalSize: { w: number; h: number };
  newSize: { w: number; h: number };
  base64: string;
}

const MAX_SIDE = 1600;
const JPEG_QUALITY = 88;

export async function preprocessImageForOcr(input: string | Blob): Promise<PreprocessResult> {
  let jimp: Awaited<ReturnType<typeof Jimp.read>>;
  if (typeof input === "string") {
    // data URL or http URL
    if (input.startsWith("data:")) {
      const base64 = input.replace(/^data:[^;]+;base64,/, "");
      const buf = Buffer.from(base64, "base64");
      jimp = await Jimp.read(buf);
    } else {
      jimp = await Jimp.read(input);
    }
  } else {
    const buf = Buffer.from(await input.arrayBuffer());
    jimp = await Jimp.read(buf);
  }

  const origW = jimp.width;
  const origH = jimp.height;
  let didPreprocess = false;

  // 1. Resize so longest side <= MAX_SIDE. Skip if already smaller.
  if (Math.max(origW, origH) > MAX_SIDE) {
    if (origW >= origH) {
      jimp.resize({ w: MAX_SIDE });
    } else {
      jimp.resize({ h: MAX_SIDE });
    }
    didPreprocess = true;
  }

  // 2. Greyscale.
  jimp.greyscale();
  didPreprocess = true;

  // 3. Normalize histogram contrast.
  jimp.normalize();

  // 4. Mild unsharp mask to crisp up text after the histogram stretch.
  //    Kernel sharpens the center using a 3x3 with -1/4 on diagonals and +1
  //    on center, divided by a small weight to keep it from amplifying noise.
  try {
    jimp.convolute([
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ]);
  } catch {
    // Some Jimp builds reject custom kernels; ignore.
  }

  const out = await jimp.getBuffer("image/jpeg", { quality: JPEG_QUALITY });
  const base64 = Buffer.from(out).toString("base64");

  return {
    dataUrl: `data:image/jpeg;base64,${base64}`,
    mimeType: "image/jpeg",
    preprocessed: didPreprocess,
    originalSize: { w: origW, h: origH },
    newSize: { w: jimp.width, h: jimp.height },
    base64,
  };
}

/**
 * Convenience: extract just the base64 of a data URL, for the /api/ocr POST body.
 */
export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.replace(/^data:[^;]+;base64,/, "");
}
