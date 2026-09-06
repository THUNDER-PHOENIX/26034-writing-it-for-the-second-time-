"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllScans, deleteScan, seedDemoData, type ScanRecord } from "@/lib/storage";

export default function ReportsPage() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "compliant" | "non-compliant">("all");

  useEffect(() => {
    seedDemoData();
    setScans(getAllScans());
  }, []);

  const filtered = useMemo(() => {
    return scans.filter((s) => {
      if (filter === "compliant" && !s.compliant) return false;
      if (filter === "non-compliant" && s.compliant) return false;
      if (!q) return true;
      const t = q.toLowerCase();
      return (
        s.productName.toLowerCase().includes(t) ||
        (s.manufacturer ?? "").toLowerCase().includes(t) ||
        s.location.toLowerCase().includes(t) ||
        s.inspector.toLowerCase().includes(t)
      );
    });
  }, [scans, q, filter]);

  function onDelete(id: string) {
    if (!confirm("Delete this scan?")) return;
    deleteScan(id);
    setScans(getAllScans());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-slate-500 text-sm">All scanned products and their compliance history</p>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          className="flex-1 border rounded-md px-3 py-2 text-sm"
          placeholder="Search by product, manufacturer, inspector, location…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-1 text-sm">
          {(["all", "compliant", "non-compliant"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-md border ${
                filter === f ? "bg-brand-50 border-brand-500 text-brand-700" : "bg-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Link href="/scan" className="btn-primary text-sm">+ New Scan</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b bg-slate-50">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Manufacturer</th>
              <th className="px-4 py-3">Inspector</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No scans match your search.</td></tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/reports/${s.id}`} className="font-medium hover:underline">{s.productName}</Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{s.manufacturer ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{s.inspector}</td>
                <td className="px-4 py-3 text-slate-600">{s.location}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(s.scannedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium">{s.score}%</td>
                <td className="px-4 py-3">
                  {s.compliant
                    ? <span className="badge badge-green">Compliant</span>
                    : <span className="badge badge-red">Non-Compliant</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => onDelete(s.id)} className="text-xs text-slate-500 hover:text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
