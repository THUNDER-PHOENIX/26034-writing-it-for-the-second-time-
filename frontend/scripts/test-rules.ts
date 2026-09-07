import { runComplianceCheck, extractKeyFields } from "../src/lib/rules";

const samples: { name: string; text: string; expectFields?: Record<string, string | null>; expectMissing?: string[] }[] = [
  {
    name: "Ideal compliant label",
    text: `
ABC FOODS PVT LTD
Plot 12, MIDC, Mumbai 400001
Butter Cookies
Net Wt. 200g
MRP Rs. 120 (incl. of all taxes)
Mfd. Date: Mar 2024
Best before 12 months from packaging
Customer Care: 1800-123-4567
care@abcfoods.in
Made in India
Ingredients: Wheat flour, sugar, butter, salt
8901234567890
`,
    expectFields: { mrp: "120", netQuantity: "200 g", mfgDate: "Mar 2024" },
  },
  {
    name: "M.R.P. with decimals and a full year",
    text: `
AMUL Butter
Net Wt: 500 g
M.R.P. Rs. 270.00 (incl. of all taxes)
Mfg. Date: 15/09/2024
Best Before: 6 months from mfg.
Gujarat Co-operative Milk Marketing Federation Ltd
Anand, Gujarat 388001
info@amul.in
`,
    expectFields: { mrp: "270.00", netQuantity: "500 g", mfgDate: "15/09/2024", company: "Gujarat Co-operative Milk Marketing Federation Ltd" },
  },
  {
    name: "Year-first mfg date and OCR-broken 'Ing redients'",
    text: `
XYZ SNACKS
Net wt 50g
MRP Rs 20
MFG 2024/05
Best Before 6 months
Ing redients: Corn, Salt, Oil
Mfg. by: XYZ Foods Pvt Ltd
Delhi 110001
1800-100-200
890111100005
`,
    expectFields: { mrp: "20", netQuantity: "50 g", mfgDate: "2024/05" },
  },
  {
    name: "Phonetic best_before ('Best before six months')",
    text: `
PARLE Glucose Biscuits
NET WT. 100 g
MRP Rs.5
Best before six months from packaging
Mfd. Date: Mar 24
Parle Products Pvt. Ltd.
Mumbai, Maharashtra 400099
consumer@parle.com
8901030865278
`,
    expectFields: { netQuantity: "100 g", company: "Parle Products Pvt. Ltd" },
  },
  {
    name: "Phone fragment should NOT be flagged as barcode",
    text: `
COLGATE STRONG TEETH
Net Wt: 200 g
MRP Rs.110
Mfd. Date: Jan 2025
Mfd. by: Colgate-Palmolive (India) Ltd
Mumbai 400099
Customer Care: 022-23821000
8901234567890
`,
    expectFields: { mrp: "110", netQuantity: "200 g", mfgDate: "Jan 2025", company: "Colgate-Palmolive (India)" },
  },
];

let failures = 0;

for (const s of samples) {
  const fields = extractKeyFields(s.text);
  const r = runComplianceCheck(s.text);
  console.log("==========================================");
  console.log("SAMPLE:", s.name);
  console.log(`Score: ${r.score}%  Compliant: ${r.compliant}  C/M/m: ${r.criticalCount}/${r.majorCount}/${r.minorCount}`);
  console.log("Fields:", fields);
  for (const v of r.violations) {
    const tag = v.matched ? "OK  " : "MISS";
    console.log(`  [${tag}] ${v.ruleId}${v.matchedValue ? "  -> " + v.matchedValue : ""}`);
  }

  if (s.expectFields) {
    for (const [key, expected] of Object.entries(s.expectFields)) {
      const actual = (fields as Record<string, string | null>)[key];
      if (actual !== expected) {
        console.log(`  FAIL: field ${key} expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
        failures++;
      }
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} field assertion(s) failed.`);
  process.exit(1);
}
console.log("\nAll field assertions passed.");
