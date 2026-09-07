import { runComplianceCheck, extractKeyFields } from "../src/lib/rules";
import { analyzeFontSize, type WordBox } from "../src/lib/fontSize";

const cases: { name: string; text: string; words: WordBox[]; imageHeight: number }[] = [
  {
    name: "Compliant label",
    text: `ABC FOODS PVT LTD Plot 12 MIDC Mumbai 400001 Butter Cookies 200g Net Wt. 200g MRP Rs. 120 (incl. of all taxes) Mfd. Date: Mar 2024 Best before 12 months from packaging Customer Care: 1800-123-4567 care@abcfoods.in Made in India Ingredients: Wheat flour sugar butter salt 8901234567890`,
    imageHeight: 1000,
    words: [
      { text: "ABC", bbox: { x0: 50, y0: 100, x1: 110, y1: 140 }, confidence: 90 },
      { text: "FOODS", bbox: { x0: 120, y0: 100, x1: 220, y1: 140 }, confidence: 90 },
      { text: "PVT", bbox: { x0: 230, y0: 100, x1: 290, y1: 140 }, confidence: 90 },
      { text: "LTD", bbox: { x0: 300, y0: 100, x1: 360, y1: 140 }, confidence: 90 },
      { text: "MRP", bbox: { x0: 50, y0: 300, x1: 130, y1: 340 }, confidence: 90 },
      { text: "Rs.", bbox: { x0: 140, y0: 300, x1: 190, y1: 340 }, confidence: 90 },
      { text: "120", bbox: { x0: 200, y0: 300, x1: 260, y1: 340 }, confidence: 90 },
      { text: "Net", bbox: { x0: 50, y0: 400, x1: 100, y1: 432 }, confidence: 90 },
      { text: "Wt.", bbox: { x0: 110, y0: 400, x1: 160, y1: 432 }, confidence: 90 },
      { text: "200g", bbox: { x0: 170, y0: 400, x1: 230, y1: 432 }, confidence: 90 },
      { text: "Mfd.", bbox: { x0: 50, y0: 500, x1: 120, y1: 530 }, confidence: 90 },
      { text: "Mar", bbox: { x0: 130, y0: 500, x1: 180, y1: 530 }, confidence: 90 },
      { text: "2024", bbox: { x0: 190, y0: 500, x1: 260, y1: 530 }, confidence: 90 },
    ],
  },
  {
    name: "Sparse label (only MRP & weight)",
    text: "Snack pack 50g MRP Rs. 20",
    imageHeight: 1000,
    words: [
      { text: "MRP", bbox: { x0: 50, y0: 300, x1: 130, y1: 340 }, confidence: 90 },
      { text: "Rs.", bbox: { x0: 140, y0: 300, x1: 190, y1: 340 }, confidence: 90 },
      { text: "20", bbox: { x0: 200, y0: 300, x1: 260, y1: 340 }, confidence: 90 },
      { text: "50g", bbox: { x0: 400, y0: 400, x1: 460, y1: 432 }, confidence: 90 },
    ],
  },
];

for (const c of cases) {
  const r = runComplianceCheck(c.text);
  const f = extractKeyFields(c.text);
  const fontFindings = analyzeFontSize(c.words, c.imageHeight, r.violations);
  console.log(`\n=== ${c.name} ===`);
  console.log("Fields:", f);
  console.log(`Score: ${r.score}%  Compliant: ${r.compliant}  (C/M/m: ${r.criticalCount}/${r.majorCount}/${r.minorCount})`);
  console.log("Font findings:", fontFindings.map((x) => `${x.field}:${x.rating}`).join(" | ") || "none");
  const missing = r.violations.filter((v) => !v.matched).map((v) => v.ruleName);
  console.log("Missing:", missing.length ? missing.join(", ") : "none");
}