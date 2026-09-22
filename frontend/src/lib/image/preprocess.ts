"use client";

/** Browser-native preprocessing. Local illumination correction can improve
 * visible low-contrast text; it cannot restore clipped glare or dewarp a label.
 * The existing JPEG result and image coordinate system remain unchanged.
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
  const isTempUrl = typeof input !== "string";
  const imgUrl = typeof input === "string" ? input : URL.createObjectURL(input);
  try {
    const img = await loadImage(imgUrl);
    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;
    if (!Number.isFinite(origW) || !Number.isFinite(origH) || origW <= 0 || origH <= 0) {
      throw new Error("Invalid image dimensions for preprocessing");
    }
    const scale = Math.min(1, MAX_SIDE / Math.max(origW, origH));
    const newW = Math.max(1, Math.round(origW * scale));
    const newH = Math.max(1, Math.round(origH * scale));
    const canvas = document.createElement("canvas");
    canvas.width = newW;
    canvas.height = newH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D canvas context");
    // JPEG has no alpha: composite transparent documents onto white, not black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, newW, newH);
    ctx.drawImage(img, 0, 0, newW, newH);
    const imageData = ctx.getImageData(0, 0, newW, newH);
    const data = imageData.data;
    const lums = new Uint8Array(newW * newH);
    let minLum = 255;
    let maxLum = 0;
    for (let p = 0; p < lums.length; p++) {
      const i = p * 4;
      const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      lums[p] = lum;
      minLum = Math.min(minLum, lum);
      maxLum = Math.max(maxLum, lum);
    }
    const range = maxLum - minLum;
    // Integral image gives a bounded O(width*height) local mean calculation.
    // Float64 avoids overflow on the largest permitted image.
    const stride = newW + 1;
    const integral = new Float64Array(stride * (newH + 1));
    for (let y = 0; y < newH; y++) {
      let row = 0;
      for (let x = 0; x < newW; x++) {
        row += lums[y * newW + x];
        integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + row;
      }
    }
    const radius = Math.max(8, Math.round(Math.min(newW, newH) * 0.03));
    function localMean(x: number, y: number): number {
      const left = Math.max(0, x - radius);
      const top = Math.max(0, y - radius);
      const right = Math.min(newW, x + radius + 1);
      const bottom = Math.min(newH, y + radius + 1);
      const sum = integral[bottom * stride + right] - integral[top * stride + right]
        - integral[bottom * stride + left] + integral[top * stride + left];
      return sum / ((right - left) * (bottom - top));
    }
    let darkest = 255;
    let brightest = 0;
    const sampleStep = Math.max(1, Math.floor(Math.min(newW, newH) / 16));
    for (let y = 0; y < newH; y += sampleStep) {
      for (let x = 0; x < newW; x += sampleStep) {
        const mean = localMean(x, y);
        darkest = Math.min(darkest, mean);
        brightest = Math.max(brightest, mean);
      }
    }
    // Conservative blend, enabled only with substantial spatial variation.
    // This is a lighting heuristic, not a glare/curvature detector.
    const strength = range > 40 ? Math.min(0.65, Math.max(0, (brightest - darkest - 35) / 120)) : 0;
    for (let y = 0; y < newH; y++) {
      for (let x = 0; x < newW; x++) {
        const p = y * newW + x;
        const lum = lums[p];
        // Preserve flat/near-flat images instead of amplifying noise or making
        // a completely white page black when maxLum equals minLum.
        const stretched = range > 8 ? ((lum - minLum) * 255) / range : lum;
        const normalized = strength > 0 ? Math.min(255, lum * 220 / Math.max(40, localMean(x, y))) : stretched;
        const value = Math.round(stretched * (1 - strength) + normalized * strength);
        data[p * 4] = value;
        data[p * 4 + 1] = value;
        data[p * 4 + 2] = value;
      }
    }
    // Mild edge enhancement avoids the previous 5/-1 kernel's strong halos.
    const copy = new Uint8ClampedArray(data);
    if (range > 8) {
      for (let y = 1; y < newH - 1; y++) {
        for (let x = 1; x < newW - 1; x++) {
          const i = (y * newW + x) * 4;
          const value = Math.round(1.6 * copy[i] - 0.15 * (
            copy[i - newW * 4] + copy[i + newW * 4] + copy[i - 4] + copy[i + 4]
          ));
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    return {
      dataUrl,
      mimeType: "image/jpeg",
      preprocessed: true,
      originalSize: { w: origW, h: origH },
      newSize: { w: newW, h: newH },
      base64: dataUrlToBase64(dataUrl),
    };
  } finally {
    if (isTempUrl) URL.revokeObjectURL(imgUrl);
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
