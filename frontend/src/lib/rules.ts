export type Severity = "critical" | "major" | "minor" | "ok";

export interface DeclarationRule {
  id: string;
  name: string;
  description: string;
  ruleRef: string;
  patterns: RegExp[];
  validator?: (text: string) => boolean;
  severity: Severity;
}

export interface Violation {
  ruleId: string;
  ruleName: string;
  ruleRef: string;
  severity: Severity;
  message: string;
  matched: boolean;
  matchedValue?: string;
}

const RULES: DeclarationRule[] = [
  {
    id: "manufacturer_address",
    name: "Name & Address of Manufacturer/Packer/Importer",
    description:
      "Every package must bear the name and complete address (including pincode) of the manufacturer or packer or importer.",
    ruleRef: "Rule 6(1)(a), Schedule II Part I",
    patterns: [
      /\b(mfd\.?\s*by|mfg\.?\s*by|manufactured\s*by|packed\s*by|imported\s*by|marketed\s*by)\b\s*[:\-]?\s*([A-Za-z0-9 ,&.'\-\/]{3,})/i,
      /[A-Za-z][A-Za-z0-9 ,&.'\-\/]{5,}\b(?:pvt\.?|ltd\.?|limited|industries|enterprises|foods|products|company)\b/i,
    ],
    severity: "critical",
  },
  {
    id: "net_quantity",
    name: "Net Quantity (in standard units)",
    description:
      "Net quantity in terms of weight, measure or number must be declared in metric units (g, kg, ml, L).",
    ruleRef: "Rule 6(1)(b), Schedule II Part II",
    patterns: [
      /\b(net\s*wt\.?|net\s*weight|net\s*qty|quantity|contents|net)\b\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(g|gm|gram|grams|kg|kilogram|ml|millilitre|l|litre|liter|nos?|pieces?)\b/i,
      /\b([0-9]+(?:\.[0-9]+)?)\s*(g|gm|kg|ml|l|kgf|nos?)\b/i,
    ],
    severity: "critical",
  },
  {
    id: "mrp",
    name: "Maximum Retail Price (MRP) inclusive of all taxes",
    description:
      "MRP must be declared, must include all taxes, and the words 'Maximum Retail Price' or 'MRP' must precede the price.",
    ruleRef: "Rule 6(1)(c)",
    patterns: [
      /\b(?:maximum\s*retail\s*price|mrp|m\.r\.p\.?)\b\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*\.?\s*([0-9]+(?:\.[0-9]+)?)/i,
      /₹\s*([0-9]+(?:\.[0-9]+)?)/,
    ],
    severity: "critical",
  },
  {
    id: "mfg_date",
    name: "Month & Year of Manufacture/Packing/Import",
    description:
      "Month and year of manufacture or packing or import must be declared.",
    ruleRef: "Rule 6(1)(d)",
    patterns: [
      /\b(?:mfg\.?|mfd\.?|mfg\.?\s*date|manufactured\s*on|packed\s*on|best\s*before|expiry|exp\.?)\b\s*[:\-]?\s*([0-9]{1,2}[\/\-\.][0-9]{2,4}|[A-Za-z]{3,9}\s*[0-9]{2,4}|[0-9]{1,2}[\/\-\.][0-9]{4})/i,
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s*[0-9]{2,4}\b/i,
      /\b[0-9]{1,2}[\/\-\.][0-9]{4}\b/,
    ],
    severity: "major",
  },
  {
    id: "country_origin",
    name: "Country of Origin (for imported goods)",
    description:
      "For imported packages, the country of origin must be declared.",
    ruleRef: "Rule 6(1)(e)",
    patterns: [
      /\b(made\s*in|product\s*of|manufactured\s*in|country\s*of\s*origin|imported\s*from)\b\s*[:\-]?\s*([A-Za-z][A-Za-z\s]{2,30})/i,
    ],
    severity: "major",
  },
  {
    id: "consumer_care",
    name: "Consumer Care Details",
    description:
      "Name, address, telephone, email of the person responsible for consumer complaints.",
    ruleRef: "Rule 6(1)(f)",
    patterns: [
      /\b(customer\s*care|consumer\s*care|for\s*complaints|for\s*queries|feedback|contact\s*us)\b/i,
      /\b(0?[0-9]{10})\b/,
      /\b[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}\b/i,
    ],
    severity: "major",
  },
  {
    id: "best_before",
    name: "Best Before / Expiry Date (food items)",
    description:
      "Best before or expiry date for food articles, in plain language.",
    ruleRef: "Rule 6(1)(g) & 18",
    patterns: [
      /\b(best\s*before|use\s*before|expiry|exp\.?\s*date|shelf\s*life)\b\s*[:\-]?\s*([0-9]{1,2}[\/\-\.][0-9]{2,4}|[A-Za-z]{3,9}\s*[0-9]{2,4}|[0-9]+\s*(days?|months?|years?))/i,
    ],
    severity: "major",
  },
  {
    id: "ingredients",
    name: "Ingredients (food products)",
    description:
      "List of ingredients for food articles in descending order of composition.",
    ruleRef: "Rule 6(1)(h) & 42",
    patterns: [
      /\bingredients?\b\s*[:\-]/i,
    ],
    severity: "major",
  },
  {
    id: "nutritional",
    name: "Nutritional Information (food products)",
    description:
      "Nutritional information per 100g or 100ml or per serving for food articles.",
    ruleRef: "Rule 6(1)(i) & 42(2)",
    patterns: [
      /\b(nutritional\s*(?:information|facts?)|nutrition\s*facts?)\b/i,
      /\b(energy|protein|carbohydrate|fat|sugar|sodium|cholesterol)\b\s*[:\-]?\s*[0-9]/i,
    ],
    severity: "minor",
  },
  {
    id: "veg_nonveg",
    name: "Veg / Non-Veg Symbol",
    description:
      "Green dot for vegetarian, brown dot for non-vegetarian food.",
    ruleRef: "Rule 6(1)(j) & 33",
    patterns: [
      /\b(veg(?:etarian)?|veg\.?\s*symbol|green\s*dot)\b/i,
      /\b(non[\s\-]?veg(?:etarian)?|brown\s*dot)\b/i,
    ],
    severity: "minor",
  },
  {
    id: "customer_email_phone",
    name: "Customer Care Email/Phone",
    description:
      "Email or phone number for consumer contact must be present.",
    ruleRef: "Rule 6(1)(f) read with 35",
    patterns: [
      /\b[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}\b/i,
      /\b(0?[0-9]{10}|\+91[\s\-]?[0-9]{10}|1800[\s\-]?[0-9\-]+)\b/,
      /\b(toll\s*free|customer\s*care\s*no)\b/i,
    ],
    severity: "minor",
  },
  {
    id: "barcode",
    name: "Barcode / EAN / UPC",
    description:
      "A machine-readable barcode is generally present on packaged commodities.",
    ruleRef: "Rule 6(1)(k) (industry practice)",
    patterns: [
      /\b([0-9]{8}|[0-9]{12}|[0-9]{13})\b/,
    ],
    severity: "minor",
  },
];

export function runComplianceCheck(ocrText: string): {
  violations: Violation[];
  score: number;
  compliant: boolean;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
} {
  const normalized = ocrText.replace(/\s+/g, " ");
  const violations: Violation[] = [];
  let critical = 0, major = 0, minor = 0;
  let totalWeight = 0, gotWeight = 0;

  for (const rule of RULES) {
    let matched = false;
    let matchedValue: string | undefined;
    for (const p of rule.patterns) {
      const m = normalized.match(p);
      if (m) {
        matched = true;
        matchedValue = m[0];
        break;
      }
    }

    const weight = rule.severity === "critical" ? 3 : rule.severity === "major" ? 2 : 1;
    totalWeight += weight;

    if (matched) {
      gotWeight += weight;
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleRef: rule.ruleRef,
        severity: "ok",
        message: "Declaration present and detected.",
        matched: true,
        matchedValue,
      });
    } else {
      if (rule.severity === "critical") critical++;
      else if (rule.severity === "major") major++;
      else minor++;
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleRef: rule.ruleRef,
        severity: rule.severity,
        message: `Missing or unreadable: ${rule.name}.`,
        matched: false,
      });
    }
  }

  const score = totalWeight === 0 ? 0 : Math.round((gotWeight / totalWeight) * 100);
  const compliant = critical === 0 && major === 0;

  return {
    violations,
    score,
    compliant,
    criticalCount: critical,
    majorCount: major,
    minorCount: minor,
  };
}

export function extractKeyFields(ocrText: string) {
  const text = ocrText.replace(/\s+/g, " ");
  const mrpMatch = text.match(/\b(?:maximum\s*retail\s*price|mrp|m\.r\.p\.?)\b\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*\.?\s*([0-9]+(?:\.[0-9]+)?)/i)
    || text.match(/₹\s*([0-9]+(?:\.[0-9]+)?)/);
  const netMatch = text.match(/\b([0-9]+(?:\.[0-9]+)?)\s*(g|gm|gram|grams|kg|kilogram|ml|millilitre|l|litre|liter|kgf|nos?|pieces?)\b/i);
  const mfgMatch = text.match(/\b(?:mfg\.?|mfd\.?|manufactured\s*on|packed\s*on|mfg\.?\s*date|mfd\.?\s*date)\b[^A-Za-z0-9]{0,6}([0-9]{1,2}[\/\-\.][0-9]{2,4}|[A-Za-z]{3,9}\s*[0-9]{2,4})/i)
    || text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*[0-9]{2,4}\b/i);
  const companyMatch = text.match(/\b(mfd\.?\s*by|mfg\.?\s*by|manufactured\s*by|packed\s*by|imported\s*by|marketed\s*by)\b\s*[:\-]?\s*([A-Z][A-Za-z0-9 ,&.'\-\/]{2,80}?)(?=\s+(?:Plot|Flat|Plot|Survey|No\.|Road|Street|MIDC|Phase|\d{6}|Net|MRP|Mfg|Mfd|Best|Ing|Customer|India|Email|Tel|Ph|FAX|Made)|\n|$)/i)
    || text.match(/\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4})\s+(PVT\.?\s*LTD\.?|LTD\.?|LIMITED|PRIVATE\s+LIMITED|INDUSTRIES|ENTERPRISES|FOODS|PRODUCTS|COMPANY|CO\.)\b/i);

  let company: string | null = null;
  if (companyMatch) {
    company = (companyMatch[2] || companyMatch[1] || "").trim().replace(/[\s\.,]+$/, "");
  }

  return {
    mrp: mrpMatch ? mrpMatch[1] : null,
    netQuantity: netMatch ? `${netMatch[1]} ${netMatch[2]}` : null,
    mfgDate: mfgMatch ? mfgMatch[1].trim() : null,
    company,
  };
}
