/**
 * Product category model.
 *
 * Different product classes have different mandatory-declaration requirements
 * under the Legal Metrology (Packaged Commodities) Rules, 2011. For example:
 *   - Food articles need MRP, net qty, mfg date, ingredients, best-before,
 *     nutritional info, veg/non-veg symbol, plus manufacturer.
 *   - Cosmetics need MRP, net qty, mfg date, ingredients (INCI), manufacturer.
 *   - Consumer goods (soap, detergent) need MRP, net qty, mfg date, manufacturer.
 *   - Drugs need MRP, net qty, batch/lot, mfg/exp date, manufacturer.
 *
 * Auto-detection is best-effort and runs on the OCR text. Inspectors can also
 * override the category manually on the scan page.
 */

export type Category = "food" | "beverage" | "cosmetic" | "drug" | "consumer_good" | "unknown";

export const CATEGORY_OPTIONS: { value: Category; label: string; hint: string }[] = [
  { value: "food", label: "Food", hint: "biscuits, snacks, ready-to-eat, oil, ghee, spice mixes" },
  { value: "beverage", label: "Beverage", hint: "soft drinks, juice, water, milk, tea, coffee" },
  { value: "cosmetic", label: "Cosmetic", hint: "shampoo, cream, lotion, soap (cosmetic-grade)" },
  { value: "drug", label: "Drug / OTC", hint: "ayurvedic, homeopathic, OTC medicine" },
  { value: "consumer_good", label: "Consumer good", hint: "detergent, soap (household), cleaner, stationery" },
  { value: "unknown", label: "Other / auto-detect", hint: "let the app pick a category from the OCR text" },
];

const REQUIRED_BY_CATEGORY: Record<Category, string[]> = {
  food: [
    "manufacturer_address",
    "net_quantity",
    "mrp",
    "mfg_date",
    "consumer_care",
    "best_before",
    "ingredients",
    "nutritional",
    "veg_nonveg",
    "customer_email_phone",
    "barcode",
  ],
  beverage: [
    "manufacturer_address",
    "net_quantity",
    "mrp",
    "mfg_date",
    "consumer_care",
    "best_before",
    "ingredients",
    "customer_email_phone",
    "barcode",
  ],
  cosmetic: [
    "manufacturer_address",
    "net_quantity",
    "mrp",
    "mfg_date",
    "consumer_care",
    "best_before",
    "ingredients",
    "customer_email_phone",
    "barcode",
  ],
  drug: [
    "manufacturer_address",
    "net_quantity",
    "mrp",
    "mfg_date",
    "consumer_care",
    "best_before",
    "ingredients",
    "customer_email_phone",
    "barcode",
  ],
  consumer_good: [
    "manufacturer_address",
    "net_quantity",
    "mrp",
    "mfg_date",
    "consumer_care",
    "customer_email_phone",
    "barcode",
  ],
  unknown: [
    "manufacturer_address",
    "net_quantity",
    "mrp",
    "mfg_date",
    "consumer_care",
    "customer_email_phone",
    "barcode",
  ],
};

export function requiredRulesFor(category: Category): string[] {
  return REQUIRED_BY_CATEGORY[category] ?? REQUIRED_BY_CATEGORY.unknown;
}

/**
 * Best-effort category detection from OCR text.
 *
 * Heuristics (in priority order):
 *   - Volume unit dominant (ml, l, litre) AND no solid (g/kg) on same label → beverage
 *   - Mentions "shampoo", "cream", "lotion", "conditioner" → cosmetic
 *   - Mentions "syrup", "tablet", "capsule", "medicine", "ayurvedic" → drug
 *   - Mentions "detergent", "cleaner", "phenyl", "toilet" → consumer_good
 *   - Mentions "ingredients:" AND "best before" AND veg/non-veg → food
 *   - Default: food (most common packaged commodity in India)
 */
export function detectCategory(text: string, violations: { ruleId: string; matched: boolean }[]): Category {
  const t = text.toLowerCase();
  const has = (re: RegExp) => re.test(t);
  const hasRule = (id: string) => violations.find((v) => v.ruleId === id)?.matched;

  if (has(/\b(shampoo|conditioner|hair\s*oil|face\s*wash|face\s*cream|body\s*lotion|hand\s*wash|skin\s*cream|lip\s*balm)\b/)) {
    return "cosmetic";
  }
  if (has(/\b(syrup|tablet|capsule|medicine|ayurvedic|homeopathic|ointment|drops|tonic)\b/)) {
    return "drug";
  }
  if (has(/\b(detergent|cleaner|phenyl|toilet\s*cleaner|disinfectant|floor\s*cleaner|bleach)\b/)) {
    return "consumer_good";
  }
  // Beverage: predominantly volume unit (ml/l/litre) with no g/kg on the label.
  const hasMl = has(/\b(ml|millilitre|millilitres|litre|liter|l\b)/);
  const hasG = has(/\b(g|gm|gram|kg|kilogram)\b/);
  if (hasMl && !hasG) return "beverage";

  // Food signal: ingredients + best_before present (both are common on food).
  if (hasRule("ingredients") && hasRule("best_before")) return "food";

  // Loose food signals.
  if (has(/\b(ingredients|nutritional|biscuit|cookie|noodle|chips|namkeen|chocolate|candy|spice|atta|flour|rice|dal|tea|coffee|edible\s*oil|butter|ghee|cheese|yogurt)\b/)) {
    return "food";
  }

  return "food"; // default
}
