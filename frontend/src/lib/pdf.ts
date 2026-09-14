"use client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ScanRecord } from "./storage";

/**
 * Enhanced PDF report generator with detailed compliance analysis.
 *
 * Generates comprehensive PDF reports including:
 * - Product details and inspector information
 * - Compliance score and status
 * - Rule-wise findings with severity classification
 * - Font size analysis
 * - Extracted text from OCR
 * - Recommendations for non-compliance
 */

export function generateReportPdf(scan: ScanRecord) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Legal Metrology Compliance Report", pageWidth / 2, yPos, { align: "center" });

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Packaged Commodities Rules, 2011", pageWidth / 2, yPos, { align: "center" });

  yPos += 15;

  // Product Information Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Product Information", 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const productInfo = [
    ["Product Name", scan.productName],
    ["Manufacturer", scan.manufacturer || "—"],
    ["MRP", scan.mrp ? `Rs. ${scan.mrp}` : "—"],
    ["Net Quantity", scan.netQuantity || "—"],
    ["Mfg. Date", scan.mfgDate || "—"],
    ["Category", scan.category || "—"],
    ["Barcode", scan.barcodeValue || "—"],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: productInfo,
    theme: "grid",
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 120 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Inspection Details
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Inspection Details", 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const inspectionInfo = [
    ["Inspector", scan.inspector],
    ["Location", scan.location],
    ["Scan Date", new Date(scan.scannedAt).toLocaleString()],
    ["OCR Provider", scan.ocrProvider || "—"],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: inspectionInfo,
    theme: "grid",
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 120 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Compliance Score Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Compliance Score", 14, yPos);
  yPos += 10;

  // Score box
  const scoreBoxWidth = 60;
  const scoreBoxHeight = 30;
  const scoreBoxX = pageWidth / 2 - scoreBoxWidth / 2;

  if (scan.compliant) {
    doc.setFillColor(34, 197, 94); // green
  } else {
    doc.setFillColor(239, 68, 68); // red
  }
  doc.rect(scoreBoxX, yPos, scoreBoxWidth, scoreBoxHeight, "F");

  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text(`${scan.score}%`, pageWidth / 2, yPos + 15, { align: "center" });

  doc.setFontSize(12);
  doc.text(scan.compliant ? "COMPLIANT" : "NON-COMPLIANT", pageWidth / 2, yPos + 25, { align: "center" });

  doc.setTextColor(0, 0, 0);
  yPos += scoreBoxHeight + 15;

  // Violation Summary
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Critical Violations: ${scan.criticalCount}`, 14, yPos);
  doc.text(`Major Violations: ${scan.majorCount}`, 80, yPos);
  doc.text(`Minor Violations: ${scan.minorCount}`, 146, yPos);

  yPos += 15;

  // Rule-wise Findings
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Rule-wise Compliance Analysis", 14, yPos);
  yPos += 8;

  const tableData = scan.violations.map((v) => [
    v.ruleName,
    v.ruleRef,
    v.matched ? "✓ OK" : v.severity.toUpperCase(),
    v.matched ? (v.matchedValue || "Found") : v.message,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Declaration", "Rule Reference", "Status", "Notes"]],
    body: tableData,
    theme: "striped",
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 70 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const text = data.cell.text[0];
        if (text === "✓ OK") {
          data.cell.styles.textColor = [34, 197, 94]; // green
          data.cell.styles.fontStyle = "bold";
        } else if (text === "CRITICAL") {
          data.cell.styles.textColor = [239, 68, 68]; // red
          data.cell.styles.fontStyle = "bold";
        } else if (text === "MAJOR") {
          data.cell.styles.textColor = [245, 158, 11]; // amber
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Font Size Analysis
  if (scan.fontFindings && scan.fontFindings.length > 0) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Font Size & Readability Analysis", 14, yPos);
    yPos += 8;

    const fontData = scan.fontFindings.map((f) => [
      f.field,
      f.matchedText.substring(0, 30),
      `${f.heightPctOfImage.toFixed(2)}%`,
      f.rating === "ok" ? "✓ OK" : f.rating === "warn" ? "⚠ SMALL" : "✗ TOO SMALL",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Field", "Detected Text", "Height (% of image)", "Status"]],
      body: fontData,
      theme: "striped",
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Recommendations (if non-compliant)
  if (!scan.compliant) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Recommendations", 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const recommendations = [
      "1. Ensure all mandatory declarations are clearly printed on the package",
      "2. Use font sizes that are legible and meet the minimum height requirements",
      "3. Include complete manufacturer/packer/importer details with address",
      "4. Display MRP prominently with the text 'Maximum Retail Price' or 'MRP'",
      "5. Provide accurate net quantity in standard metric units",
      "6. Include manufacturing/packing dates in a clear format",
    ];

    recommendations.forEach((rec) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      const lines = doc.splitTextToSize(rec, pageWidth - 28);
      doc.text(lines, 14, yPos);
      yPos += lines.length * 5 + 3;
    });

    yPos += 10;
  }

  // OCR Text Extract (new page)
  doc.addPage();
  yPos = 20;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Extracted Text (OCR)", 14, yPos);
  yPos += 8;

  doc.setFontSize(8);
  doc.setFont("courier", "normal");
  const ocrLines = doc.splitTextToSize(scan.ocrText.substring(0, 2000), pageWidth - 28);
  ocrLines.forEach((line: string) => {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(line, 14, yPos);
    yPos += 4;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${new Date().toLocaleString()} | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text("Legal Metrology Compliance Checker - SIH 2026", pageWidth / 2, pageHeight - 6, { align: "center" });
  }

  // Save PDF
  const filename = `LM_Report_${scan.productName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
}