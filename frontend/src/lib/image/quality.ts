/**
 * Image quality analysis for product label OCR.
 * Checks resolution, brightness/exposure, and sharpness/blur.
 */

export interface ImageQualityReport {
  score: number; // 0 - 100
  isAcceptable: boolean;
  resolution: { w: number; h: number; status: "good" | "low" };
  brightness: { value: number; status: "good" | "dark" | "overexposed" };
  sharpness: { variance: number; status: "sharp" | "blurry" | "fair" };
  warnings: string[];
}

export async function analyzeImageQuality(imageDataUrl: string): Promise<ImageQualityReport> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      const canvas = document.createElement("canvas");
      // Scale down for fast pixel inspection
      const sampleW = Math.min(w, 400);
      const sampleH = Math.round((h / w) * sampleW);
      canvas.width = sampleW;
      canvas.height = sampleH;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        resolve(fallbackQuality(w, h));
        return;
      }

      ctx.drawImage(img, 0, 0, sampleW, sampleH);
      const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
      const pixels = imgData.data;

      // 1. Brightness & Contrast Analysis
      let totalLuminance = 0;
      const gray = new Float32Array(sampleW * sampleH);

      for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        gray[p] = lum;
        totalLuminance += lum;
      }

      const avgBrightness = totalLuminance / (sampleW * sampleH);

      // 2. Blur / Sharpness estimation via modified Laplacian gradient
      let laplacianSum = 0;
      let laplacianSqSum = 0;
      let count = 0;

      for (let y = 1; y < sampleH - 1; y++) {
        for (let x = 1; x < sampleW - 1; x++) {
          const idx = y * sampleW + x;
          const center = gray[idx];
          // 3x3 Laplacian kernel [0, 1, 0; 1, -4, 1; 0, 1, 0]
          const lap =
            gray[idx - sampleW] +
            gray[idx + sampleW] +
            gray[idx - 1] +
            gray[idx + 1] -
            4 * center;

          laplacianSum += lap;
          laplacianSqSum += lap * lap;
          count++;
        }
      }

      const meanLap = count > 0 ? laplacianSum / count : 0;
      const variance = count > 0 ? laplacianSqSum / count - meanLap * meanLap : 0;

      // Classifications
      const warnings: string[] = [];

      // Resolution
      const resStatus: "good" | "low" = w >= 600 && h >= 400 ? "good" : "low";
      if (resStatus === "low") {
        warnings.push(`Low resolution (${w}x${h}px). Min 800x600 recommended.`);
      }

      // Brightness
      let brightStatus: "good" | "dark" | "overexposed" = "good";
      if (avgBrightness < 45) {
        brightStatus = "dark";
        warnings.push("Image is too dark. Increase lighting or use flashlight.");
      } else if (avgBrightness > 220) {
        brightStatus = "overexposed";
        warnings.push("Image has harsh glare/overexposure. Avoid direct flash.");
      }

      // Sharpness
      let sharpStatus: "sharp" | "blurry" | "fair" = "sharp";
      if (variance < 40) {
        sharpStatus = "blurry";
        warnings.push("Image text appears blurry. Hold camera steady and refocus.");
      } else if (variance < 100) {
        sharpStatus = "fair";
      }

      // Overall Score
      let score = 100;
      if (resStatus === "low") score -= 20;
      if (brightStatus !== "good") score -= 25;
      if (sharpStatus === "blurry") score -= 35;
      else if (sharpStatus === "fair") score -= 10;
      score = Math.max(10, Math.min(100, score));

      resolve({
        score,
        isAcceptable: score >= 50,
        resolution: { w, h, status: resStatus },
        brightness: { value: Math.round(avgBrightness), status: brightStatus },
        sharpness: { variance: Math.round(variance), status: sharpStatus },
        warnings,
      });
    };

    img.onerror = () => resolve(fallbackQuality(800, 600));
    img.src = imageDataUrl;
  });
}

function fallbackQuality(w: number, h: number): ImageQualityReport {
  return {
    score: 85,
    isAcceptable: true,
    resolution: { w, h, status: "good" },
    brightness: { value: 128, status: "good" },
    sharpness: { variance: 120, status: "sharp" },
    warnings: [],
  };
}
