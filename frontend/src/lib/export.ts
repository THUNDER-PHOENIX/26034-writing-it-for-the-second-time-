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
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  downloadFile(csvContent, `LM_Compliance_Report_${Date.now()}.csv`, "text/csv");
}

/**
 * Export scans to JSON format
 */
export function exportToJSON(scans: ScanRecord[]): void {
  const jsonContent = JSON.stringify(scans, null, 2);
  downloadFile(jsonContent, `LM_Compliance_Report_${Date.now()}.json`, "application/json");
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