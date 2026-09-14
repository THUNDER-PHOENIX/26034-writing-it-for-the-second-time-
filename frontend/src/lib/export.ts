/**
 * Export utilities for compliance reports.
 *
 * Provides functions to export scan data in various formats:
 * - CSV for spreadsheet analysis
 * - Excel for detailed reports
 * - JSON for data interchange
 */

import type { ScanRecord } from "./storage";

/**
 * Export scans to CSV format
 */
export function exportToCSV(scans: ScanRecord[]): void {
  const headers = [
    "Scan ID",
    "Product Name",
    "Manufacturer",
    "MRP",
    "Net Quantity",
    "Mfg Date",
    "Category",
    "Score",
    "Compliant",
    "Critical Violations",
    "Major Violations",
    "Minor Violations",
    "Inspector",
    "Location",
    "Scan Date",
    "Barcode",
  ];

  const rows = scans.map(scan => [
    scan.id,
    scan.productName,
    scan.manufacturer || "",
    scan.mrp || "",
    scan.netQuantity || "",
    scan.mfgDate || "",
    scan.category || "",
    scan.score.toString(),
    scan.compliant ? "Yes" : "No",
    scan.criticalCount.toString(),
    scan.majorCount.toString(),
    scan.minorCount.toString(),
    scan.inspector,
    scan.location,
    new Date(scan.scannedAt).toLocaleString(),
    scan.barcodeValue || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
  ].join("\n");

  downloadFile(csvContent, `compliance_report_${Date.now()}.csv`, "text/csv");
}

/**
 * Export scans to JSON format
 */
export function exportToJSON(scans: ScanRecord[]): void {
  const jsonContent = JSON.stringify(scans, null, 2);
  downloadFile(jsonContent, `compliance_report_${Date.now()}.json`, "application/json");
}

/**
 * Export detailed compliance report with violations
 */
export function exportDetailedReport(scans: ScanRecord[]): void {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalScans: scans.length,
      compliantCount: scans.filter(s => s.compliant).length,
      nonCompliantCount: scans.filter(s => !s.compliant).length,
      averageScore: scans.reduce((sum, s) => sum + s.score, 0) / scans.length,
      totalViolations: {
        critical: scans.reduce((sum, s) => sum + s.criticalCount, 0),
        major: scans.reduce((sum, s) => sum + s.majorCount, 0),
        minor: scans.reduce((sum, s) => sum + s.minorCount, 0),
      },
    },
    scans: scans.map(scan => ({
      id: scan.id,
      productName: scan.productName,
      manufacturer: scan.manufacturer,
      score: scan.score,
      compliant: scan.compliant,
      violations: scan.violations.filter(v => !v.matched),
      inspector: scan.inspector,
      location: scan.location,
      scannedAt: scan.scannedAt,
    })),
  };

  const jsonContent = JSON.stringify(report, null, 2);
  downloadFile(jsonContent, `detailed_compliance_report_${Date.now()}.json`, "application/json");
}

/**
 * Helper function to download a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}