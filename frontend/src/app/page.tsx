"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllScans, seedDemoData, type ScanRecord } from "@/lib/storage";

export default function Dashboard() {
  const [scans, setScans] = useState<ScanRecord[]>([]);

  useEffect(() => {
    seedDemoData();
    getAllScans().then(setScans);
  }, []);

  const total = scans.length;
  const compliantCount = scans.filter((s) => s.compliant).length;
  const nonCompliantCount = total - compliantCount;
  const compliancePct = total === 0 ? 0 : Math.round((compliantCount / total) * 100);
  const totalViolations = scans.reduce(
    (acc, s) => acc + s.criticalCount * 3 + s.majorCount * 2 + s.minorCount,
    0
  );
  const avgScore = total === 0 ? 0 : Math.round(scans.reduce((a, s) => a + s.score, 0) / total);

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const count = scans.filter((s) => s.scannedAt.slice(0, 10) === key).length;
    return { day: d.toLocaleDateString(undefined, { weekday: "short" }), count };
  });
  const maxBar = Math.max(1, ...last7.map((d) => d.count));

  const recentViolations = scans
    .filter((s) => !s.compliant)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Enforcement Dashboard</h1>
          <p className="text-slate-500 text-sm">Overview of inspections and compliance status</p>
        </div>
        <Link href="/scan" className="btn-primary">+ New Scan</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total Scans" value={total} />
        <Stat label="Compliant" value={compliantCount} accent="text-green-700" />
        <Stat label="Non-Compliant" value={nonCompliantCount} accent="text-red-700" />
        <Stat label="Avg. Score" value={`${avgScore}%`} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm text-slate-500">Compliance Rate</div>
              <div className="text-3xl font-semibold mt-1">{compliancePct}%</div>
            </div>
            <div className="text-sm text-slate-500">Total Violations: {totalViolations}</div>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${compliancePct}%` }} />
          </div>

          <div className="mt-6">
            <div className="text-sm text-slate-500 mb-2">Last 7 days activity</div>
            <div className="flex items-end gap-2 h-32">
              {last7.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-brand-500 rounded-t"
                    style={{ height: `${(d.count / maxBar) * 100}%`, minHeight: 4 }}
                    title={`${d.count} scans`}
                  />
                  <div className="text-xs text-slate-500">{d.day}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="font-semibold mb-3">Recent Violations</div>
          {recentViolations.length === 0 && (
            <div className="text-sm text-slate-500">No violations recorded yet.</div>
          )}
          <ul className="space-y-3">
            {recentViolations.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-3 border-b last:border-0 pb-3 last:pb-0">
                <div className="min-w-0">
                  <Link href={`/reports/${s.id}`} className="font-medium hover:underline truncate block">
                    {s.productName}
                  </Link>
                  <div className="text-xs text-slate-500">{new Date(s.scannedAt).toLocaleDateString()} • {s.location}</div>
                </div>
                <span className="badge badge-red">{s.score}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Recent Scans</div>
          <Link href="/reports" className="text-sm text-brand-600 hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2">Product</th>
                <th className="py-2">Inspector</th>
                <th className="py-2">Date</th>
                <th className="py-2">Score</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {scans.slice(0, 8).map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2">
                    <Link href={`/reports/${s.id}`} className="hover:underline">{s.productName}</Link>
                  </td>
                  <td className="py-2 text-slate-600">{s.inspector}</td>
                  <td className="py-2 text-slate-600">{new Date(s.scannedAt).toLocaleDateString()}</td>
                  <td className="py-2 font-medium">{s.score}%</td>
                  <td className="py-2">
                    {s.compliant
                      ? <span className="badge badge-green">Compliant</span>
                      : <span className="badge badge-red">Non-Compliant</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
