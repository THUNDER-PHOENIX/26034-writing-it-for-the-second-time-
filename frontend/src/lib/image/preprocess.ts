"use client";

/**
 * High-performance browser-native image preprocessing for OCR accuracy.
 *
 * Uses HTML5 Canvas API (no Node.js dependencies/Buffers) to perform:
 * 1. Preserve high-resolution label details (downscale only very large images)
 * 2. Grayscale conversion (standard luminance weighting)
 * 3. Gentle contrast stretch (normalizes shadows & lighting)
 *
 * Small-print labels are unusually sensitive to destructive denoising and
 * aggressive sharpening, so we intentionally keep the original pixel detail.
 */

export interface PreprocessResult {
  dataUrl: string;
  mimeType: "image/jpeg";
  preprocessed: boolean;
  originalSize: { w: number; h: number };
  newSize: { w: number; h: number };
  base64: string;
}

const MAX_SIDE = 2400;
const JPEG_QUALITY = 0.96;

export async function preprocessImageForOcr(input: string | Blob): Promise<PreprocessResult> {
  let imgUrl: string;
  let isTempUrl = false;

  if (typeof input === "string") {
    imgUrl = input;
  } else {
    imgUrl = URL.createObjectURL(input);
    isTempUrl = true;
  }

  try {
    const img = await loadImage(imgUrl);
    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;

    // Calculate new dimensions (scale down if > MAX_SIDE)
    let newW = origW;
    let newH = origH;
    if (Math.max(origW, origH) > MAX_SIDE) {
      if (origW >= origH) {
        newW = MAX_SIDE;
        newH = Math.round((origH * MAX_SIDE) / origW);
      } else {
        newH = MAX_SIDE;
        newW = Math.round((origW * MAX_SIDE) / origH);
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = newW;
    canvas.height = newH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get 2D canvas context");
    }

    // Draw and resize
    ctx.drawImage(img, 0, 0, newW, newH);

    // Get pixel data for processing
    const imageData = ctx.getImageData(0, 0, newW, newH);
    const data = imageData.data;
    const len = data.length;

    // Step 1: Grayscale & find min/max luminance for contrast stretch
    let minLum = 255;
    let maxLum = 0;
    const lums = new Uint8Array(newW * newH);

    for (let i = 0, p = 0; i < len; i += 4, p++) {
      // Standard ITU-R BT.601 luminance
      const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      lums[p] = lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }

    // Trim a small number of extreme pixels so a specular highlight does not
    // consume the entire contrast range and flatten the label text.
    const histogram = new Uint32Array(256);
    for (const luminance of lums) histogram[luminance]++;
    const pixelCount = lums.length;
    const lowerTarget = Math.floor(pixelCount * 0.01);
    const upperTarget = Math.ceil(pixelCount * 0.99);
    let cumulative = 0;
    let low = 0;
    let high = 255;
    for (let value = 0; value < 256; value++) {
      cumulative += histogram[value];
      if (cumulative >= lowerTarget) { low = value; break; }
    }
    cumulative = 0;
    for (let value = 0; value < 256; value++) {
      cumulative += histogram[value];
      if (cumulative >= upperTarget) { high = value; break; }
    }
    if (high - low < 24) { low = minLum; high = maxLum; }
    const range = high - low || 1;
    // Work on original image pixel data
    for (let i = 0, p = 0; i < len; i += 4, p++) {
      const stretched = Math.min(255, Math.max(0, Math.round(((lums[p] - low) * 255) / range)));
      data[i] = stretched;     // R
      data[i + 1] = stretched; // G
      data[i + 2] = stretched; // B
      // Alpha remains unchanged
    }

    // Put stretched grayscale image back so the denoising step sees grayscale data
    ctx.putImageData(imageData, 0, 0);

    // Retain edge pixels and thin character strokes: a median filter removes
    // precisely the tiny punctuation and strokes that matter on package labels.
    ctx.putImageData(imageData, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "");

    return {
      dataUrl,
      mimeType: "image/jpeg",
      preprocessed: true,
      originalSize: { w: origW, h: origH },
      newSize: { w: newW, h: newH },
      base64,
    };
  } finally {
    if (isTempUrl) {
      URL.revokeObjectURL(imgUrl);
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error("Failed to load image for preprocessing: " + String(e)));
    img.src = src;
  });
}

export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.replace(/^data:[^;]+;base64,/, "");
}
