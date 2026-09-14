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
  // Enhanced fields for compliance tracking
  department?: string;
  inspectorId?: string;
  complianceNotes?: string;
  actionTaken?: "warning" | "fine" | "seizure" | "none";
  fineAmount?: number;
  followUpDate?: string;
  evidencePhotos?: string[];
  reportStatus?: "draft" | "submitted" | "approved" | "closed";
}

export {
  saveScanAnywhere as saveScan,
  getAllScansAnywhere as getAllScans,
  getScanByIdAnywhere as getScanById,
  deleteScanAnywhere as deleteScan,
  isSupabaseConfigured,
} from "./storage/anywhere";

const KEY = "lm_scans_v1";

function localGet(): ScanRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * Seed demo data into localStorage on first run so the dashboard has content.
 * Only runs when localStorage is empty AND Supabase isn't configured (because
 * remote would have its own demo data path). No-op on the server.
 */
export function seedDemoData() {
  if (typeof window === "undefined") return;
  // Never replace real scans. This function is called when the dashboard and
  // reports pages mount, so overwriting an existing collection here made a
  // newly-created scan disappear before its detail page could load.
  if (localGet().length > 0) return;
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
  const now = Date.now();
  const records = samples.map((s, i) => ({
    ...s,
    id: `seed-${i}`,
    scannedAt: new Date(now - i * 86400000).toISOString(),
  }));
  localStorage.setItem(KEY, JSON.stringify(records));
}
