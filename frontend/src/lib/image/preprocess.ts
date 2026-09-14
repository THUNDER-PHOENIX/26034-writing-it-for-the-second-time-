"use client";

/**
 * High-performance browser-native image preprocessing for OCR accuracy.
 *
 * Uses HTML5 Canvas API (no Node.js dependencies/Buffers) to perform:
 * 1. Resizing to optimal OCR resolution (max dimension 1600px)
 * 2. Grayscale conversion (standard luminance weighting)
 * 3. Histogram contrast stretching (normalizes shadows & lighting)
 * 4. Crisp 3x3 unsharp convolution filter (sharpens text edges)
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
const JPEG_QUALITY = 0.92;

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

    // Step 2: Apply contrast stretch
    const range = maxLum - minLum || 1;
    for (let i = 0, p = 0; i < len; i += 4, p++) {
      const stretched = Math.min(255, Math.max(0, Math.round(((lums[p] - minLum) * 255) / range)));
      data[i] = stretched;     // R
      data[i + 1] = stretched; // G
      data[i + 2] = stretched; // B
      // Alpha remains unchanged
    }

    // Put stretched grayscale image back
    ctx.putImageData(imageData, 0, 0);

    // Step 3: Fast 3x3 sharpening (unsharp mask)
    try {
      const sharpImageData = ctx.getImageData(0, 0, newW, newH);
      const sharpData = sharpImageData.data;
      const copy = new Uint8ClampedArray(data);

      for (let y = 1; y < newH - 1; y++) {
        for (let x = 1; x < newW - 1; x++) {
          const idx = (y * newW + x) * 4;
          // Kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0]
          const top = ((y - 1) * newW + x) * 4;
          const bottom = ((y + 1) * newW + x) * 4;
          const left = (y * newW + (x - 1)) * 4;
          const right = (y * newW + (x + 1)) * 4;

          const val =
            5 * copy[idx] -
            copy[top] -
            copy[bottom] -
            copy[left] -
            copy[right];

          const clamped = val < 0 ? 0 : val > 255 ? 255 : val;
          sharpData[idx] = clamped;
          sharpData[idx + 1] = clamped;
          sharpData[idx + 2] = clamped;
        }
      }
      ctx.putImageData(sharpImageData, 0, 0);
    } catch {
      // If sharpening fails, keep contrast stretched version
    }

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
