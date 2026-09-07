"use client";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/browser";

/**
 * Decode a barcode from an image data URL (or HTTP URL) using ZXing.
 *
 * ZXing is significantly more reliable at reading barcodes than OCR
 * (which mistakes phone-number tails for 8-digit EAN-8 codes). The
 * decoded value is the authoritative one when both fire.
 *
 * Returns null if no barcode is detected.
 */
export interface BarcodeHit {
  value: string;
  format: string;
}

const READER = new BrowserMultiFormatReader();

export async function decodeBarcodeFromDataUrl(dataUrl: string): Promise<BarcodeHit | null> {
  // Render the dataURL into an HTMLImageElement so ZXing can read it via canvas.
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(new Error("Failed to load image for barcode scan"));
  });
  try {
    const result = await READER.decodeFromImageElement(img);
    if (!result) return null;
    const fmtNum = result.getBarcodeFormat();
    return {
      value: result.getText(),
      format: BarcodeFormat[fmtNum] || `format-${fmtNum}`,
    };
  } catch {
    return null;
  }
}
