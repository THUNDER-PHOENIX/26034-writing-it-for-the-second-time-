"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getScanById, type ScanRecord } from "@/lib/storage";
import { generateReportPdf } from "@/lib/pdf";

export default function ReportDetail({ params }: { params: { id: string } }) {
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getScanById(params.id).then((s) => {
      if (mounted) {
        setScan(s);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [params.id]);

  if (loading) {
    return <div className="card p-6 text-center text-slate-500">Loading scan…</div>;
  }

  if (!scan) {
    return (
      <div className="card p-6 text-center text-slate-500">
        Scan not found. <Link href="/reports" className="text-brand-600 hover:underline">Back to reports</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/reports" className="text-sm text-brand-600 hover:underline">← Back to reports</Link>
          <h1 className="text-2xl font-semibold mt-1">{scan.productName}</h1>
          <div className="text-sm text-slate-500">
            Scanned on {new Date(scan.scannedAt).toLocaleString()} • {scan.inspector} • {scan.location}
            {scan.category && scan.category !== "unknown" && <> • <span className="font-medium capitalize">{scan.category}</span></>}
            {scan.ocrProvider && <> • OCR: <span className="font-mono text-xs">{scan.ocrProvider}</span></>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => generateReportPdf(scan)} className="btn-primary">Download PDF</button>
          <Link href="/scan" className="btn-secondary">New Scan</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Compliance Score</div>
              <div className={`text-4xl font-bold ${scan.compliant ? "text-green-600" : "text-red-600"}`}>{scan.score}%</div>
            </div>
            <div>
              {scan.compliant
                ? <span className="badge badge-green text-base px-3 py-1">COMPLIANT</span>
                : <span className="badge badge-red text-base px-3 py-1">NON-COMPLIANT</span>}
            </div>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-3">
            <div
              className={scan.compliant ? "h-full bg-green-500" : "h-full bg-red-500"}
              style={{ width: `${scan.score}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="badge badge-red">Critical: {scan.criticalCount}</span>
            <span className="badge badge-yellow">Major: {scan.majorCount}</span>
            <span className="badge badge-gray">Minor: {scan.minorCount}</span>
          </div>

          {scan.imageDataUrl && (
            <div className="mt-4">
              <div className="text-xs text-slate-500 mb-1">Captured Image</div>
              <img src={scan.imageDataUrl} alt="Label" className="max-h-72 rounded-md border" />
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="font-semibold mb-3">Key Declarations</div>
          <Row k="Manufacturer" v={scan.manufacturer} />
          <Row k="Net Quantity" v={scan.netQuantity} />
          <Row k="MRP" v={scan.mrp ? `Rs. ${scan.mrp}` : null} />
          <Row k="Mfg. Date" v={scan.mfgDate} />
          {scan.barcodeValue && (
            <Row k="Barcode" v={`${scan.barcodeValue} (decoded by ZXing)`} />
          )}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="p-4 font-semibold border-b">Rule-wise Findings</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b bg-slate-50">
              <th className="px-4 py-3">Declaration</th>
              <th className="px-4 py-3">Rule Reference</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {scan.violations.map((v) => (
              <tr key={v.ruleId} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{v.ruleName}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{v.ruleRef}</td>
                <td className="px-4 py-3">
                  {v.matched
                    ? <span className="badge badge-green">OK</span>
                    : v.severity === "critical"
                    ? <span className="badge badge-red">CRITICAL</span>
                    : v.severity === "major"
                    ? <span className="badge badge-yellow">MAJOR</span>
                    : <span className="badge badge-gray">MINOR</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {v.matched ? <span className="font-mono text-xs">Found: {v.matchedValue}</span> : v.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {scan.fontFindings && scan.fontFindings.length > 0 && (
        <div className="card overflow-x-auto">
          <div className="p-4 font-semibold border-b flex items-center justify-between">
            <span>Font Size &amp; Readability Analysis</span>
            <span className="text-xs text-slate-500 font-normal">Based on OCR bounding boxes vs. image height (Rule 6, Schedule II)</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b bg-slate-50">
                <th className="px-4 py-3">Field</th>
                <th className="px-4 py-3">Detected Text</th>
                <th className="px-4 py-3">Height (% of image)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {scan.fontFindings.map((f) => (
                <tr key={f.ruleId} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{f.field}</td>
                  <td className="px-4 py-3 font-mono text-xs">{f.matchedText}</td>
                  <td className="px-4 py-3">{f.heightPctOfImage.toFixed(2)}%</td>
                  <td className="px-4 py-3">
                    {f.rating === "ok" && <span className="badge badge-green">OK</span>}
                    {f.rating === "warn" && <span className="badge badge-yellow">SMALL</span>}
                    {f.rating === "fail" && <span className="badge badge-red">TOO SMALL</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{f.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card p-5">
        <div className="font-semibold mb-2">Extracted Text (OCR)</div>
        <pre className="text-xs whitespace-pre-wrap bg-slate-50 border rounded-md p-3 max-h-72 overflow-auto">{scan.ocrText}</pre>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex items-start justify-between border-b last:border-0 py-2 text-sm">
      <div className="text-slate-500">{k}</div>
      <div className="font-medium text-right">{v ?? "—"}</div>
    </div>
  );
}
