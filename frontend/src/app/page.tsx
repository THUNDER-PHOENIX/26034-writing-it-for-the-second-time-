"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllScans, type ScanRecord } from "@/lib/storage";

export default function Dashboard() {
  const [scans, setScans] = useState<ScanRecord[]>([]);

  useEffect(() => {
    getAllScans().then(setScans);
  }, []);

  const total = scans.length;
  const compliantCount = scans.filter((s) => s.compliant).length;
  const nonCompliantCount = total - compliantCount;
  const compliancePct = total === 0 ? 0 : Math.round((compliantCount / total) * 100);
  const totalCritical = scans.reduce((acc, s) => acc + s.criticalCount, 0);
  const totalMajor = scans.reduce((acc, s) => acc + s.majorCount, 0);
  const avgScore = total === 0 ? 0 : Math.round(scans.reduce((a, s) => a + s.score, 0) / total);

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const count = scans.filter((s) => s.scannedAt.slice(0, 10) === key).length;
    return { day: d.toLocaleDateString(undefined, { weekday: "short" }), count };
  });
  const maxBar = Math.max(1, ...last7.map((d) => d.count));

  const recentViolations = scans.filter((s) => !s.compliant).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action Hero */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-blue-800/60 border border-blue-400/30 text-blue-200 text-xs px-3 py-1 rounded-full font-medium">
            <span>🛡️ Official Inspection Dashboard</span>
            <span>•</span>
            <span>Karnataka Enforcement Zone</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Legal Metrology Compliance Monitor
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed">
            Automated compliance checking for packaged commodities under PCR Rules, 2011. Scan labels, analyze 12 statutory declarations, and generate digital legal reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/scan" className="btn-primary bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm px-5 py-3 shadow-lg">
            📷 Scan New Product
          </Link>
          <Link href="/reports" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl px-4 py-3 text-sm font-semibold transition-all">
            📋 View All Reports
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="📦"
          label="Total Inspected"
          value={total}
          subtitle="Packaged commodities"
          color="blue"
        />
        <StatCard
          icon="✅"
          label="Fully Compliant"
          value={compliantCount}
          subtitle={`${compliancePct}% compliance rate`}
          color="green"
        />
        <StatCard
          icon="⚠️"
          label="Violations Detected"
          value={nonCompliantCount}
          subtitle={`${totalCritical} critical · ${totalMajor} major`}
          color="red"
        />
        <StatCard
          icon="🎯"
          label="Avg. Compliance Score"
          value={`${avgScore}%`}
          subtitle="Overall standard"
          color="indigo"
        />
      </div>

      {/* Charts and Overview Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Compliance Rate & Activity Card */}
        <div className="card p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Enforcement Compliance Overview</h2>
              <p className="text-xs text-slate-500">Real-time inspection adherence rate across zones</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-slate-900">{compliancePct}%</span>
              <div className="text-xs text-slate-500">Adherence rate</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-emerald-700">Compliant ({compliantCount})</span>
              <span className="text-rose-700">Non-Compliant ({nonCompliantCount})</span>
            </div>
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${compliancePct}%` }} />
              <div className="h-full bg-rose-500 transition-all" style={{ width: `${100 - compliancePct}%` }} />
            </div>
          </div>

          {/* 7-Day Activity Chart */}
          <div>
            <div className="text-xs font-semibold text-slate-600 mb-3 flex items-center justify-between">
              <span>Weekly Scanning Activity</span>
              <span className="text-slate-400 font-normal">Past 7 days</span>
            </div>
            <div className="flex items-end gap-3 h-36 pt-4 border-t border-slate-100">
              {last7.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="text-[11px] font-semibold text-slate-600 group-hover:text-blue-600">{d.count}</div>
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-md group-hover:from-blue-700 group-hover:to-indigo-600 transition-all"
                    style={{ height: `${Math.max(12, (d.count / maxBar) * 100)}%` }}
                    title={`${d.count} scans on ${d.day}`}
                  />
                  <div className="text-[11px] font-medium text-slate-500">{d.day}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Violations Feed */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Violations</h2>
              <p className="text-xs text-slate-500">Products flagged for non-compliance</p>
            </div>
            <span className="badge badge-red">{recentViolations.length} Flagged</span>
          </div>

          {recentViolations.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              ✨ All scanned products are compliant!
            </div>
          ) : (
            <div className="space-y-3">
              {recentViolations.map((s) => (
                <Link
                  key={s.id}
                  href={`/reports/${s.id}`}
                  className="p-3 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 transition-all block group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 truncate">
                        {s.productName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        📍 {s.location} • {new Date(s.scannedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="badge badge-red text-xs whitespace-nowrap">
                      {s.score}% Score
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-rose-700 font-medium">
                    ⚠️ {s.criticalCount} Critical & {s.majorCount} Major violations
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent Inspection Repository</h2>
            <p className="text-xs text-slate-500">Latest field scans and enforcement assessments</p>
          </div>
          <Link href="/reports" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            View All Reports & Export →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 rounded-l-lg">Product Name</th>
                <th className="px-4 py-3">Manufacturer / Packer</th>
                <th className="px-4 py-3">Inspector</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3 rounded-r-lg">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scans.slice(0, 6).map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <Link href={`/reports/${s.id}`} className="font-semibold text-blue-600 hover:underline">
                      {s.productName}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 text-xs">{s.manufacturer || "—"}</td>
                  <td className="px-4 py-3.5 text-slate-600 text-xs">{s.inspector}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{new Date(s.scannedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">{s.score}%</td>
                  <td className="px-4 py-3.5">
                    {s.compliant ? (
                      <span className="badge badge-green">✓ Compliant</span>
                    ) : (
                      <span className="badge badge-red">✕ Non-Compliant</span>
                    )}
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

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  subtitle: string;
  color: "blue" | "green" | "red" | "indigo";
}) {
  const colorMap = {
    blue: "from-blue-500/10 to-blue-600/5 text-blue-600 border-blue-100",
    green: "from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-100",
    red: "from-rose-500/10 to-rose-600/5 text-rose-600 border-rose-100",
    indigo: "from-indigo-500/10 to-indigo-600/5 text-indigo-600 border-indigo-100",
  };

  return (
    <div className={`card p-5 border bg-gradient-to-br ${colorMap[color]} space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 font-medium">{subtitle}</div>
    </div>
  );
}
