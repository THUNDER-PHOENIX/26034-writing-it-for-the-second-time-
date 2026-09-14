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
  if (localGet().length > 0) return;
  const samples: Omit<ScanRecord, "id" | "scannedAt">[] = [
    {
      productName: "Nandini Pure Ghee 500ml",
      manufacturer: "Karnataka Co-operative Milk Producers' Federation Ltd (KMF)",
      imageDataUrl: null,
      ocrText: "Karnataka Co-operative Milk Producers' Federation Ltd, Bengaluru 560029. Net Qty: 500 ml. MRP Rs. 310 (incl. of all taxes). Mfd. Date: 08/2026. Best before 9 months from manufacture. Customer Care: 1800-425-8030. support@kmfnandini.coop. Made in India. Veg Logo: Green Dot. 8906036670012",
      mrp: "310",
      netQuantity: "500 ml",
      mfgDate: "08/2026",
      category: "food",
      score: 96,
      compliant: true,
      criticalCount: 0,
      majorCount: 0,
      minorCount: 0,
      violations: [
        { ruleId: "manufacturer_address", ruleName: "Name & Address of Manufacturer", ruleRef: "Rule 6(1)(a)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "Karnataka Co-operative Milk Producers' Federation Ltd, Bengaluru" },
        { ruleId: "net_quantity", ruleName: "Net Quantity", ruleRef: "Rule 6(1)(b)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "500 ml" },
        { ruleId: "mrp", ruleName: "Maximum Retail Price (MRP)", ruleRef: "Rule 6(1)(c)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "MRP Rs. 310" },
        { ruleId: "mfg_date", ruleName: "Month & Year of Manufacture", ruleRef: "Rule 6(1)(d)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "08/2026" },
        { ruleId: "consumer_care", ruleName: "Consumer Care Details", ruleRef: "Rule 6(1)(f)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "1800-425-8030" },
        { ruleId: "best_before", ruleName: "Best Before Date", ruleRef: "Rule 6(1)(g)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "Best before 9 months" },
        { ruleId: "barcode", ruleName: "Barcode / EAN", ruleRef: "Rule 6(1)(k)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "8906036670012" },
      ],
      inspector: "S. Kumar (Inspector, Bengaluru Central)",
      location: "Bengaluru (Koramangala Market)",
      barcodeValue: "8906036670012",
    },
    {
      productName: "Mysore Sandal Soap 150g",
      manufacturer: "Karnataka Soaps and Detergents Limited (KSDL)",
      imageDataUrl: null,
      ocrText: "Karnataka Soaps & Detergents Ltd, Bengaluru 560055. Net Wt. 150g. MRP: ₹85.00 (Incl. of all taxes). Mfd: 07/2026. Customer care: 080-28381200. Made in India. 8901058852319",
      mrp: "85.00",
      netQuantity: "150 g",
      mfgDate: "07/2026",
      category: "cosmetic",
      score: 93,
      compliant: true,
      criticalCount: 0,
      majorCount: 0,
      minorCount: 1,
      violations: [
        { ruleId: "manufacturer_address", ruleName: "Name & Address of Manufacturer", ruleRef: "Rule 6(1)(a)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "Karnataka Soaps & Detergents Ltd" },
        { ruleId: "net_quantity", ruleName: "Net Quantity", ruleRef: "Rule 6(1)(b)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "150g" },
        { ruleId: "mrp", ruleName: "Maximum Retail Price (MRP)", ruleRef: "Rule 6(1)(c)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "MRP: ₹85.00" },
        { ruleId: "mfg_date", ruleName: "Month & Year of Manufacture", ruleRef: "Rule 6(1)(d)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "07/2026" },
        { ruleId: "consumer_care", ruleName: "Consumer Care Details", ruleRef: "Rule 6(1)(f)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "080-28381200" },
      ],
      inspector: "M. Ramesh (Inspector, Mysuru Zone)",
      location: "Mysuru (Devaraja Market)",
      barcodeValue: "8901058852319",
    },
    {
      productName: "Unbranded Masala Mix 100g (Violation Sample)",
      manufacturer: "Sri Balaji Foods",
      imageDataUrl: null,
      ocrText: "Sri Balaji Foods, Hubballi. Net Wt 100g. Spicy aromatic masala mix. Contains natural spices.",
      mrp: null,
      netQuantity: "100 g",
      mfgDate: null,
      category: "food",
      score: 42,
      compliant: false,
      criticalCount: 2,
      majorCount: 2,
      minorCount: 1,
      violations: [
        { ruleId: "manufacturer_address", ruleName: "Name & Address of Manufacturer", ruleRef: "Rule 6(1)(a)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "Sri Balaji Foods, Hubballi" },
        { ruleId: "net_quantity", ruleName: "Net Quantity", ruleRef: "Rule 6(1)(b)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "100g" },
        { ruleId: "mrp", ruleName: "Maximum Retail Price (MRP)", ruleRef: "Rule 6(1)(c)", severity: "critical", message: "Missing or unreadable: MRP not declared on package.", matched: false },
        { ruleId: "mfg_date", ruleName: "Month & Year of Manufacture", ruleRef: "Rule 6(1)(d)", severity: "major", message: "Missing or unreadable: Date of packing/mfg missing.", matched: false },
        { ruleId: "consumer_care", ruleName: "Consumer Care Details", ruleRef: "Rule 6(1)(f)", severity: "major", message: "Missing consumer complaint contact number or email.", matched: false },
        { ruleId: "best_before", ruleName: "Best Before / Expiry", ruleRef: "Rule 6(1)(g)", severity: "major", message: "Missing Best Before / Expiry declaration.", matched: false },
      ],
      inspector: "V. Patil (Legal Metrology Officer)",
      location: "Hubballi (APMC Market)",
    },
    {
      productName: "Imported Energy Drink Can 250ml",
      manufacturer: "Euro Beverages GmbH",
      imageDataUrl: null,
      ocrText: "Euro Beverages GmbH, Munich Germany. 250ml. Energy drink with taurine and caffeine. Best before: 12/2026. Made in Germany.",
      mrp: null,
      netQuantity: "250 ml",
      mfgDate: "12/2026",
      category: "beverage",
      score: 58,
      compliant: false,
      criticalCount: 1,
      majorCount: 1,
      minorCount: 1,
      violations: [
        { ruleId: "manufacturer_address", ruleName: "Name & Address of Manufacturer / Importer", ruleRef: "Rule 6(1)(a)", severity: "critical", message: "Missing Indian importer name and address with pincode.", matched: false },
        { ruleId: "net_quantity", ruleName: "Net Quantity", ruleRef: "Rule 6(1)(b)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "250ml" },
        { ruleId: "mrp", ruleName: "Maximum Retail Price (MRP)", ruleRef: "Rule 6(1)(c)", severity: "critical", message: "Missing Indian Rupees (₹/Rs) MRP declaration.", matched: false },
        { ruleId: "country_origin", ruleName: "Country of Origin", ruleRef: "Rule 6(1)(e)", severity: "ok", message: "Declaration present and detected.", matched: true, matchedValue: "Made in Germany" },
      ],
      inspector: "S. Kumar (Inspector, Bengaluru Central)",
      location: "Bengaluru (Indiranagar Supermarket)",
    }
  ];
  const now = Date.now();
  const records = samples.map((s, i) => ({
    ...s,
    id: `scan-ka-00${i + 1}`,
    scannedAt: new Date(now - i * 43200000).toISOString(),
  }));
  localStorage.setItem(KEY, JSON.stringify(records));
}
