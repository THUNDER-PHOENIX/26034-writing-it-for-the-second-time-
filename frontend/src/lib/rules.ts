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

// MRP head — match MRP / mrp / m.r.p. / M.R.P. (with optional trailing dot).
// Use a lookahead `(?:\.|\b)` for the trailing boundary so the optional dot
// after M.R.P. doesn't break the word-boundary check.
const MRP_HEAD = String.raw`(?:maximum\s*retail\s*price|m\.?\s*r\.?\s*p\.?|mrp)(?:\.|\b)`;
const MRP_PRICE_TAIL = String.raw`\s*[:\-]?\s*(?:rs\.?|inr|₹|m\.?r\.?p\.?)?\s*\.?\s*([0-9]{1,5}(?:[.,][0-9]{1,2})?)`;

// Date token — accept MM/YY, MM/YYYY, YYYY/MM, YYYY-MM, MMM YYYY, "15 Sep 2024".
const DATE_TOKEN = String.raw`(?:[0-9]{1,2}[\/\-\.\s][0-9]{1,2}[\/\-\.\s][0-9]{2,4}|[0-9]{1,2}[\/\-\.][0-9]{2,4}|[0-9]{4}[\/\-\.][0-9]{1,2}|[A-Za-z]{3,9}[\-\.\s,]+[0-9]{2,4}|[0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{2,4})`;

// Spelled-out small numbers + digits.
const NUM_WORD = String.raw`(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)`;
const DURATION = String.raw`(?:days?|weeks?|months?|years?|day|week|month|year)`;

// Company-suffix alternation. Written without the `i` flag so the *prefix*
// word-initial lookaheads `(?=[A-Z])` actually require uppercase (the `i` flag
// would relax the character class and let "months from mfg" match by accident).
const COMPANY_SUFFIX = String.raw`(?:[Pp][Vv][Tt]\.?\s*[Ll][Tt][Dd]\.?|[Ll][Tt][Dd]\.?|[Ll][Ii][Mm][Ii][Tt][Ee][Dd]|[Pp][Rr][Ii][Vv][Aa][Tt][Ee]\s+[Ll][Ii][Mm][Ii][Tt][Ee][Dd]|[Ii][Nn][Dd][Uu][Ss][Tt][Rr][Ii][Ee][Ss]|[Ee][Nn][Tt][Ee][Rr][Pp][Rr][Ii][Ss][Ee][Ss]|[Ff][Oo][Oo][Dd][Ss]|[Pp][Rr][Oo][Dd][Uu][Cc][Tt][Ss]|[Cc][Oo][Mm][Pp][Aa][Nn][Yy]|[Cc][Oo]\.?|[Cc][Oo][Rr][Pp][Oo][Rr][Aa][Tt][Ii][Oo][Nn])`;

const RULES: DeclarationRule[] = [
  {
    id: "manufacturer_address",
    name: "Name & Address of Manufacturer/Packer/Importer",
    description:
      "Every package must bear the name and complete address (including pincode) of the manufacturer or packer or importer.",
    ruleRef: "Rule 6(1)(a), Schedule II Part I",
    patterns: [
      new RegExp(
        String.raw`\b(mfd\.?\s*by|mfg\.?\s*by|manufactured\s*by|packed\s*by|imported\s*by|marketed\s*by|bottled\s*by|marketed\s*&?\s*imported\s*by)\b\s*[:\-]?\s*([A-Z][A-Za-z0-9 ()\,&.'\-\/]{2,60}?)(?=\s*(?:[.,;]|\n|$|\s+(?:Plot|Flat|Survey|No\.?|Road|Street|MIDC|Phase|India|Mumbai|Delhi|Bengaluru|Hyderabad|Chennai|Kolkata|\d{6}|Net|MRP|Mfg|Mfd|Best|Ing|Customer|Email|Tel|Ph|FAX|Made|Care|Pvt|Ltd|Limited|Company|Industries|Enterprises|Foods|Products|State|Pin)))`,
        "i"
      ),
      // No `i` flag: require a capitalized first word and capitalized subsequent words
      // (so "Best Before" or "months from" don't match), while still matching suffixes
      // like "Pvt. Ltd." / "Limited" / "Co." via explicit per-letter character classes.
      new RegExp(
        String.raw`\b(?=[A-Z])[A-Za-z]+(?:\s+(?=[A-Z])[A-Za-z&.\-]+){0,5}\s+${COMPANY_SUFFIX}\b`
      ),
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
      /\b(net\s*(?:wt\.?|weight|vol\.?|volume|qty\.?|quantity|contents?)|contents|quantity)\b\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(g|gm|gram|grams|kg|kilogram|kgs|ml|millilitre|millilitres|l|lt|litre|litres|liter|liters|nos?|pcs|pieces?)\b/i,
      /(?<![A-Za-z0-9.])([0-9]+(?:\.[0-9]+)?)\s*(g|gm|kg|ml|l|nos?)\b(?![A-Za-z])/i,
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
      new RegExp(String.raw`\b${MRP_HEAD}${MRP_PRICE_TAIL}`, "i"),
      /₹\s*([0-9]+(?:[.,][0-9]{1,2})?)/,
      /\bprice\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
      // Enhanced: Catch "Rs 120", "Rs.120", "INR 120", "120 Rs"
      /\brs\.?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
      /\b([0-9]+(?:[.,][0-9]{1,2})?)\s*rs\.?\b/i,
      /\binr\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
      // Catch standalone prices near common price indicators
      /\b(?:price|cost|amount)\D{0,10}([0-9]{2,4}(?:[.,][0-9]{1,2})?)\b/i,
      // Catch MRP with extra spaces/punctuation
      /\bm\s*[.\s]*r\s*[.\s]*p\s*[:\-.\s]*([0-9]+(?:[.,][0-9]{1,2})?)/i,
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
      // MFG date tokens (allowing noisy separators)
      new RegExp(
        String.raw`\b(?:mfd\.?|mfg\.?)\b[^\n]{0,50}?(?:\s*[:\-]?\s*)([0-9]{1,2})\s*[-/]\s*([A-Za-z]{3})\s*[-/]\s*([0-9]{2,4})`,
        "i"
      ),
      new RegExp(
        String.raw`\b(?:mfd\.?|mfg\.?)\b\s*[:\-]?\s*${DATE_TOKEN}`,
        "i"
      ),
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?[\s\-\.,]+([0-9]{2,4})\b/i,
      /(?<![0-9])([0-9]{4}[\/\-\.][0-9]{1,2})(?![0-9])/,
      /(?<![0-9])([0-9]{1,2}[\/\-\.][0-9]{4})(?![0-9])/,
      /(?<![0-9])([0-9]{1,2}[\/\-\.][0-9]{2})(?![0-9])/,
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
      /\b(made\s*in|product\s*of|manufactured\s*in|produced\s*in|country\s*of\s*origin|imported\s*from|origin\s*[:\-])\b\s*[:\-]?\s*([A-Za-z][A-Za-z\s]{2,30}?)(?=[.,;\n]|$)/i,
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
      /\b(customer\s*care|consumer\s*care|for\s*complaints|for\s*queries|feedback|contact\s*us|consumer\s*cell|complaint\s*cell|grievance\s*officer)\b/i,
      /\b(?:\+?91[\s\-]?)?(?:0[\s\-]?)?(?:6|7|8|9)[0-9]{9}\b/,
      /\b1800[\s\-]?[0-9]{3,4}[\s\-]?[0-9]{3,4}\b/,
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
      new RegExp(
        String.raw`\b(best\s*before|use\s*before|expiry|exp\.?\s*date|expires\s*on|shelf\s*life)\b\s*[:\-]?\s*(${DATE_TOKEN}|${NUM_WORD}\s+${DURATION})`,
        "i"
      ),
      new RegExp(
        String.raw`\b(best\s*before|use\s*before|expiry|exp\.?\s*date|expires\s*on|shelf\s*life)\b[^\n]{0,40}?${DURATION}`,
        "i"
      ),
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
      /\bing[\s\-.]?redients?\b\s*[:\-]/i,
      /\bingredients?\b/i,
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
      /\b(nutritional\s*(?:information|facts?)|nutrition\s*facts?|nutrition\s*information)\b/i,
      /\b(energy|protein|carbohydrate|carbs|saturated\s*fat|trans\s*fat|fibre|fiber|sugar|sodium|cholesterol)\b\s*[:\-]?\s*[0-9]/i,
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
      /\b(veg(?:etarian)?|veg\.?\s*symbol|green\s*dot|brown\s*dot|non[\s\-]?veg(?:etarian)?)\b/i,
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
      /\b(?:\+?91[\s\-]?)?(?:0[\s\-]?)?(?:6|7|8|9)[0-9]{9}\b/,
      /\b1800[\s\-]?[0-9]{3,4}[\s\-]?[0-9]{3,4}\b/,
      /\b1[\s\-]?800[\s\-]?[0-9]{3,4}[\s\-]?[0-9]{3,4}\b/,
      /\b(toll\s*free|customer\s*care\s*no|helpline)\b/i,
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
      // Prefer 12/13-digit EAN/UPC — they are unambiguous.
      /(?<![0-9])([0-9]{12}|[0-9]{13})(?![0-9])/,
      // Fallback: 8-digit EAN-8 only when the digits are surrounded by whitespace/start/end
      // (to avoid matching the 8-digit tail of a phone number like 022-23821000).
      /(?<!\d)(?<=\s|^)([0-9]{8})(?=\s|$)/,
    ],
    severity: "minor",
  },
];

/**
 * Normalize OCR output for compliance rule matching.
 *
 * IMPORTANT: Global letter→digit substitution (O→0, I→1, etc.) is intentionally
 * avoided here because it destroys word-based patterns (INDIA→1ND1A, LIMITED→L1M1TED,
 * Ingredients→1ngred1ents). Instead we apply only safe, context-aware repairs:
 *
 *  1. Collapse all whitespace runs to a single space.
 *  2. Fix common OCR noise for the Indian Rupee symbol (₹ is often misread).
 *  3. In strictly numeric contexts (a digit, then an ambiguous char, then a digit),
 *     replace O→0 and l/I→1 so "2O24" → "2024" and "l00" → "100".
 *  4. Remove stray vertical-bar characters that appear from metallic-foil scans.
 */
export function normalizeOcrText(text: string): string {
  return text
    // 1. Collapse whitespace
    .replace(/\s+/g, " ")
    // 2. Indian Rupee OCR noise (Rs, R$, INR with noise, etc. — leave Rs. alone)
    .replace(/[Rr][Ss]\s*\.\s*/g, "Rs. ")
    // 3. Numeric-context letter repairs only:
    //    Replace O/Q → 0 when sandwiched between digits or at start of a digit run
    .replace(/(?<=\d)[OoQq](?=\d)/g, "0")
    //    Replace I/l → 1 when sandwiched between digits
    .replace(/(?<=\d)[Il](?=\d)/g, "1")
    //    Leading O in otherwise all-digit-or-slash strings like "O6/2024"
    .replace(/\b[Oo]([0-9]{1,2}[\/\-\.][0-9]{2,4})\b/g, "0$1")
    // 4. Remove stray pipe/vertical-bar characters from foil scan artifacts
    .replace(/\|/g, " ")
    .trim();
}

export function runComplianceCheck(
  ocrText: string,
  options?: { requiredRuleIds?: string[] }
): {
  violations: Violation[];
  score: number;
  compliant: boolean;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  requiredRuleIds?: string[];
} {
  const normalized = normalizeOcrText(ocrText);
  const violations: Violation[] = [];
  let critical = 0, major = 0, minor = 0;
  let totalWeight = 0, gotWeight = 0;
  const requiredSet = options?.requiredRuleIds ? new Set(options.requiredRuleIds) : null;

  for (const rule of RULES) {
    // Skip rules not required for the chosen product category.
    if (requiredSet && !requiredSet.has(rule.id)) continue;

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
  // Compliant if: (1) zero critical violations, AND (2) score >= 70%, AND (3) major violations <= 1
  // This allows minor flexibility while maintaining legal metrology standards
  const compliant = critical === 0 && major <= 1 && score >= 70;

  return {
    violations,
    score,
    compliant,
    criticalCount: critical,
    majorCount: major,
    minorCount: minor,
    requiredRuleIds: options?.requiredRuleIds,
  };
}

export function extractKeyFields(ocrText: string) {
  const text = ocrText.replace(/\s+/g, " ");

  const mrpMatch =
    text.match(new RegExp(String.raw`\b${MRP_HEAD}${MRP_PRICE_TAIL}`, "i")) ||
    text.match(/₹\s*([0-9]+(?:[.,][0-9]{1,2})?)/) ||
    text.match(/\bprice\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);

  const netMatch =
    text.match(
      /\b(?:net\s*(?:wt\.?|weight|vol\.?|volume|qty\.?|quantity|contents?)|contents|quantity)\b\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(g|gm|gram|grams|kg|kilogram|kgs|ml|millilitre|millilitres|l|lt|litre|litres|liter|liters|nos?|pcs|pieces?)\b/i
    ) ||
    text.match(/(?<![A-Za-z0-9.])([0-9]+(?:\.[0-9]+)?)\s*(g|gm|kg|ml|l|nos?)\b(?![A-Za-z])/i);

  const mfgMatch =
    text.match(
      new RegExp(
        String.raw`\b(?:mfg\.?|mfd\.?|mfg\.?\s*date|mfd\.?\s*date|manufactured\s*on|packed\s*on|date\s*of\s*(?:mfg|mfd|manufacture|packing|packaging|import))\b\s*[:\-]?\s*(${DATE_TOKEN})`,
        "i"
      )
    ) ||
    text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?[\s\-\.,]+([0-9]{2,4})\b/i) ||
    text.match(/(?<![0-9])([0-9]{4}[\/\-\.][0-9]{1,2})(?![0-9])/) ||
    text.match(/(?<![0-9])([0-9]{1,2}[\/\-\.][0-9]{4})(?![0-9])/) ||
    text.match(/(?<![0-9])([0-9]{1,2}[\/\-\.][0-9]{2})(?![0-9])/);

  const companyMatch =
    text.match(
      /\b(mfd\.?\s*by|mfg\.?\s*by|manufactured\s*by|packed\s*by|imported\s*by|marketed\s*by|bottled\s*by|marketed\s*&?\s*imported\s*by)\b\s*[:\-]?\s*([A-Z][A-Za-z0-9 ()\,&.'\-\/]{2,60}?)(?=\s*(?:[.,;]|\n|$|\s+(?:Plot|Flat|Survey|No\.?|Road|Street|MIDC|Phase|India|Mumbai|Delhi|Bengaluru|Hyderabad|Chennai|Kolkata|\d{6}|Net|MRP|Mfg|Mfd|Best|Ing|Customer|Email|Tel|Ph|FAX|Made|Care|Pvt|Ltd|Limited|Company|Industries|Enterprises|Foods|Products|State|Pin)))/i
    ) ||
    text.match(
      new RegExp(
        String.raw`\b(?=[A-Z])([A-Za-z]+(?:\s+(?=[A-Z])[A-Za-z&.\-]+){0,5})\s+(${COMPANY_SUFFIX})\b`
      )
    );

  let company: string | null = null;
  if (companyMatch) {
    // The second alternation (PVT/LTD pattern) captures prefix in group 1 and
    // suffix in group 2 — combine them so the result is "Parle Products Pvt. Ltd."
    // instead of just "Pvt. Ltd.".
    const isSecondPattern = companyMatch[1] && companyMatch[2] && /^(PVT\.?\s*LTD\.?|LTD\.?|LIMITED|PRIVATE\s+LIMITED|INDUSTRIES|ENTERPRISES|FOODS|PRODUCTS|COMPANY|CO\.?|CORPORATION)$/i.test(companyMatch[2]);
    if (isSecondPattern) {
      company = `${companyMatch[1]} ${companyMatch[2]}`;
    } else {
      company = (companyMatch[2] || companyMatch[1] || "").trim().replace(/[\s.,;:]+$/, "");
    }
    if (company && /^(pvt\.?\s*ltd\.?|ltd\.?|limited|company|co\.?)$/i.test(company)) {
      company = null;
    }
  }

  return {
    mrp: mrpMatch ? mrpMatch[1].replace(/,/g, ".") : null,
    netQuantity: netMatch ? `${netMatch[1]} ${netMatch[2]}` : null,
    mfgDate: mfgMatch ? mfgMatch[1].trim() : null,
    company,
  };
}
