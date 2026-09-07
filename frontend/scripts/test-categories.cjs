// Quick sanity test for category detection + per-category rule filtering.
// Mirrors the logic in src/lib/rules/categories.ts and the runComplianceCheck
// signature.
const { runComplianceCheck } = require("./src/lib/rules.ts");
const { detectCategory, requiredRulesFor } = require("./src/lib/rules/categories.ts");

const samples = [
  {
    name: "Maggi noodles (food)",
    text: "Maggi Noodles Net wt 70g MRP Rs 12 Ingredients: Wheat flour, palm oil, salt Best before 9 months care@nestle.in 8901234567890",
    override: "unknown",
  },
  {
    name: "Coca-Cola (beverage)",
    text: "Coca-Cola Net Vol 750ml MRP Rs 40 feedback@coca-colaindia.com Customer Care: 1800-266-2653 8901234567890",
    override: "unknown",
  },
  {
    name: "Shampoo (cosmetic)",
    text: "Head & Shoulders Shampoo Net Wt 200ml MRP Rs 220 Best before 24 months Mfg by H&H care@hh.com 8901234567890",
    override: "unknown",
  },
  {
    name: "Detergent (consumer_good)",
    text: "Surf Excel Detergent Net Wt 1kg MRP Rs 240 Mfd by HUL customercare@unilever.com 8901234567890",
    override: "unknown",
  },
  {
    name: "Snack (food) — auto detected even without explicit ingredients",
    text: "XYZ Chips Net wt 50g MRP Rs 20 Best before 6 months care@xyz.in 8901234567890",
    override: "unknown",
  },
];

for (const s of samples) {
  console.log("---", s.name, "---");
  const firstPass = runComplianceCheck(s.text);
  const cat = detectCategory(s.text, firstPass.violations);
  const required = requiredRulesFor(cat);
  const r = runComplianceCheck(s.text, { requiredRuleIds: required });
  console.log(`category: ${cat}, score: ${r.score}%, compliant: ${r.compliant}, required: ${required.length} rules`);
  for (const v of r.violations) {
    if (!v.matched) console.log(`  MISS: ${v.ruleId} (${v.severity})`);
  }
}
