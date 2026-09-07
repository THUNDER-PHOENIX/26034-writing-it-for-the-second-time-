import type { Violation } from "./rules";
import type { FontSizeFinding } from "./fontSize";

export interface ScanRecord {
  id: string;
  productName: string;
  manufacturer: string | null;
  imageDataUrl: string | null;
  imagePath?: string | null;
  ocrText: string;
  ocrProvider?: string;
  category?: string;
  mrp: string | null;
  netQuantity: string | null;
  mfgDate: string | null;
  score: number;
  compliant: boolean;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  violations: Violation[];
  fontFindings?: FontSizeFinding[];
  barcodeValue?: string | null;
  inspector: string;
  location: string;
  scannedAt: string;
}

const KEY = "lm_scans_v1";

export function getAllScans(): ScanRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveScan(scan: ScanRecord) {
  const all = getAllScans();
  all.unshift(scan);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 200)));
}

export function getScanById(id: string): ScanRecord | null {
  return getAllScans().find((s) => s.id === id) ?? null;
}

export function deleteScan(id: string) {
  const all = getAllScans().filter((s) => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function seedDemoData() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEY)) return;
  const now = Date.now();
  const samples: Omit<ScanRecord, "id" | "scannedAt">[] = [
    {
      productName: "Sample Butter Cookies 200g",
      manufacturer: "ABC Foods Pvt Ltd",
      imageDataUrl: null,
      ocrText: "ABC Foods Pvt Ltd, Mumbai. Net Wt. 200g. MRP Rs. 120. Mfd. Date: Mar 2024. Best before 12 months. Customer care: 1800-123-4567",
      mrp: "120",
      netQuantity: "200 g",
      mfgDate: "Mar 2024",
      score: 92,
      compliant: true,
      criticalCount: 0,
      majorCount: 0,
      minorCount: 1,
      violations: [],
      inspector: "Inspector Demo",
      location: "Mumbai",
    },
    {
      productName: "Imported Chocolates 100g",
      manufacturer: "Unknown Importer",
      imageDataUrl: null,
      ocrText: "Imported by XYZ Traders. Net Wt 100g. Made in Switzerland. Best before Jun 2025.",
      mrp: null,
      netQuantity: "100 g",
      mfgDate: "Jun 2025",
      score: 55,
      compliant: false,
      criticalCount: 1,
      majorCount: 1,
      minorCount: 2,
      violations: [],
      inspector: "Inspector Demo",
      location: "Delhi",
    },
    {
      productName: "Local Snack 50g",
      manufacturer: null,
      imageDataUrl: null,
      ocrText: "Snack pack. 50g.",
      mrp: null,
      netQuantity: "50 g",
      mfgDate: null,
      score: 30,
      compliant: false,
      criticalCount: 2,
      majorCount: 2,
      minorCount: 2,
      violations: [],
      inspector: "Inspector Demo",
      location: "Pune",
    },
  ];
  const records = samples.map((s, i) => ({
    ...s,
    id: `seed-${i}`,
    scannedAt: new Date(now - i * 86400000).toISOString(),
  }));
  localStorage.setItem(KEY, JSON.stringify(records));
}
