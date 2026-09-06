import { runComplianceCheck, extractKeyFields } from "../src/lib/rules";

const sampleText = `
ABC FOODS PVT LTD
Plot 12, MIDC Industrial Area
Mumbai 400001
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
`;

const result = runComplianceCheck(sampleText);
const fields = extractKeyFields(sampleText);

console.log("Extracted fields:", fields);
console.log("Compliance score:", result.score + "%");
console.log("Compliant:", result.compliant);
console.log("Critical/Major/Minor:", result.criticalCount, "/", result.majorCount, "/", result.minorCount);
console.log("\nFindings:");
for (const v of result.violations) {
  const tag = v.matched ? "OK" : v.severity.toUpperCase();
  console.log(`  [${tag.padEnd(8)}] ${v.ruleName}`);
  if (v.matched) console.log(`             found: ${v.matchedValue}`);
}

const nonCompliant = `Snack pack. 50g. Best before Dec 2024.`;
const r2 = runComplianceCheck(nonCompliant);
console.log("\n--- Non-compliant sample ---");
console.log("Score:", r2.score + "%", "Compliant:", r2.compliant);
console.log("Critical/Major/Minor:", r2.criticalCount, "/", r2.majorCount, "/", r2.minorCount);
