"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllScans, type ScanRecord } from "@/lib/storage";

export default function AnalyticsPage() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("all");
  const [selectedZone, setSelectedZone] = useState<string>("all");

  useEffect(() => {
    getAllScans().then(setScans);
  }, []);

  // Filtered scans based on selected timeframe & zone
  const filteredScans = useMemo(() => {
    const now = Date.now();
    return scans.filter((s) => {
      if (selectedZone !== "all" && !s.location.toLowerCase().includes(selectedZone.toLowerCase())) {
        return false;
      }
      if (timeRange === "7d") {
        return now - new Date(s.scannedAt).getTime() <= 7 * 86400000;
      }
      if (timeRange === "30d") {
        return now - new Date(s.scannedAt).getTime() <= 30 * 86400000;
      }
      return true;
    });
  }, [scans, timeRange, selectedZone]);

  // Aggregate stats
  const total = filteredScans.length;
  const compliantCount = filteredScans.filter((s) => s.compliant).length;
  const nonCompliantCount = total - compliantCount;
  const complianceRate = total > 0 ? Math.round((compliantCount / total) * 100) : 0;

  // Breakdown by statutory rule violation
  const ruleViolations = useMemo(() => {
    const map: Record<string, { name: string; count: number; severity: string; ruleRef: string }> = {};

    filteredScans.forEach((s) => {
      s.violations.forEach((v) => {
        if (!v.matched) {
          if (!map[v.ruleId]) {
            map[v.ruleId] = {
              name: v.ruleName,
              count: 0,
              severity: v.severity,
              ruleRef: v.ruleRef,
            };
          }
          map[v.ruleId].count++;
        }
      });
    });

    return Object.entries(map)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [filteredScans]);

  const maxViolationCount = Math.max(1, ...ruleViolations.map((r) => r.count));

  // Category breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; compliant: number }> = {};
    filteredScans.forEach((s) => {
      const cat = s.category || "unknown";
      if (!map[cat]) map[cat] = { total: 0, compliant: 0 };
      map[cat].total++;
      if (s.compliant) map[cat].compliant++;
    });

    return Object.entries(map).map(([cat, data]) => ({
      category: cat.charAt(0).toUpperCase() + cat.slice(1),
      total: data.total,
      compliant: data.compliant,
      rate: Math.round((data.compliant / data.total) * 100),
    }));
  }, [filteredScans]);

  // Zone / Location breakdown
  const zoneStats = useMemo(() => {
    const map: Record<string, { total: number; compliant: number; nonCompliant: number }> = {};
    filteredScans.forEach((s) => {
      const loc = s.location.split("(")[0].trim() || "Other";
      if (!map[loc]) map[loc] = { total: 0, compliant: 0, nonCompliant: 0 };
      map[loc].total++;
      if (s.compliant) map[loc].compliant++;
      else map[loc].nonCompliant++;
    });

    return Object.entries(map).map(([zone, data]) => ({
      zone,
      total: data.total,
      compliant: data.compliant,
      nonCompliant: data.nonCompliant,
      rate: Math.round((data.compliant / data.total) * 100),
    }));
  }, [filteredScans]);

  // Repeat non-compliant manufacturers
  const repeatOffenders = useMemo(() => {
    const map: Record<string, { total: number; violations: number; lastDate: string; location: string }> = {};
    filteredScans.forEach((s) => {
      const mfg = s.manufacturer || "Unbranded / Unknown";
      if (!map[mfg]) map[mfg] = { total: 0, violations: 0, lastDate: s.scannedAt, location: s.location };
      map[mfg].total++;
      if (!s.compliant) map[mfg].violations++;
      if (new Date(s.scannedAt) > new Date(map[mfg].lastDate)) {
        map[mfg].lastDate = s.scannedAt;
      }
    });

    return Object.entries(map)
      .map(([mfg, data]) => ({ mfg, ...data }))
      .filter((m) => m.violations > 0)
      .sort((a, b) => b.violations - a.violations);
  }, [filteredScans]);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-blue-800/60 border border-blue-400/30 text-blue-200 text-xs px-3 py-1 rounded-full font-medium">
            <span>📈 Enforcement Intelligence</span>
            <span>•</span>
            <span>Karnataka State Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Legal Metrology Enforcement Analytics
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed max-w-2xl">
            Statewide compliance monitoring, statutory violation frequency trends, category adherence, and repeat offender surveillance across market divisions.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/20">
          <div className="flex rounded-lg overflow-hidden border border-white/20 text-xs">
            {(["7d", "30d", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 font-semibold transition-all ${
                  timeRange === t ? "bg-white text-blue-900" : "text-white hover:bg-white/10"
                }`}
              >
                {t === "7d" ? "7 Days" : t === "30d" ? "30 Days" : "All Time"}
              </button>
            ))}
          </div>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-blue-950 text-white border border-white/20 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none"
          >
            <option value="all">All Zones</option>
            <option value="bengaluru">Bengaluru</option>
            <option value="mysuru">Mysuru</option>
            <option value="hubballi">Hubballi</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border bg-gradient-to-br from-blue-500/10 to-blue-600/5 text-blue-900 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inspections</div>
          <div className="text-3xl font-bold text-slate-900">{total}</div>
          <div className="text-xs text-slate-500">Across {zoneStats.length} enforcement divisions</div>
        </div>

        <div className="card p-5 border bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 text-emerald-900 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compliance Rate</div>
          <div className="text-3xl font-bold text-emerald-700">{complianceRate}%</div>
          <div className="text-xs text-slate-500">{compliantCount} of {total} products compliant</div>
        </div>

        <div className="card p-5 border bg-gradient-to-br from-rose-500/10 to-rose-600/5 text-rose-900 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Violations Detected</div>
          <div className="text-3xl font-bold text-rose-700">{nonCompliantCount}</div>
          <div className="text-xs text-slate-500">Requiring legal notice / seizure</div>
        </div>

        <div className="card p-5 border bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 text-indigo-900 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Repeat Offenders</div>
          <div className="text-3xl font-bold text-indigo-700">{repeatOffenders.length}</div>
          <div className="text-xs text-slate-500">Packers with &gt;1 flagged violation</div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Statutory Violations Chart */}
        <div className="card p-6 lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Top Statutory Rule Violations</h2>
              <p className="text-xs text-slate-500">Frequency of non-compliances under Legal Metrology (PCR) Rules, 2011</p>
            </div>
            <span className="badge badge-red">{ruleViolations.length} Distinct Rules Breached</span>
          </div>

          {ruleViolations.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              ✨ No statutory violations recorded for the selected filter.
            </div>
          ) : (
            <div className="space-y-4">
              {ruleViolations.map((r) => {
                const pct = Math.round((r.count / total) * 100);
                const isCritical = r.severity === "critical";
                return (
                  <div key={r.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-medium text-slate-800">
                        <span className={`w-2 h-2 rounded-full ${isCritical ? "bg-rose-500" : "bg-amber-500"}`} />
                        <span>{r.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({r.ruleRef})</span>
                      </div>
                      <div className="font-bold text-slate-700">
                        {r.count} cases ({pct}%)
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isCritical ? "bg-rose-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${(r.count / maxViolationCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Zonal Division Breakdown */}
        <div className="card p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Zonal Compliance Rate</h2>
            <p className="text-xs text-slate-500">Performance across regional enforcement zones</p>
          </div>

          <div className="space-y-4">
            {zoneStats.map((z) => (
              <div key={z.zone} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">📍 {z.zone}</span>
                  <span className={`badge ${z.rate >= 75 ? "badge-green" : "badge-red"}`}>
                    {z.rate}% Rate
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Total Scans: <strong>{z.total}</strong></span>
                  <span className="text-rose-600">Violations: <strong>{z.nonCompliant}</strong></span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${z.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Adherence & Repeat Offenders */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="card p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Category-Specific Adherence</h2>
            <p className="text-xs text-slate-500">Compliance distribution by commodity category</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {categoryStats.map((c) => (
              <div key={c.category} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase">{c.category}</div>
                <div className="text-2xl font-bold text-slate-900">{c.rate}%</div>
                <div className="text-xs text-slate-600 flex justify-between">
                  <span>Compliant: {c.compliant}/{c.total}</span>
                  <span className="font-semibold text-emerald-600">
                    {c.rate >= 75 ? "Good" : "Needs Action"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Repeat Offender Surveillance */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Repeat Non-Compliant Entities</h2>
              <p className="text-xs text-slate-500">Manufacturers/packers with recurring violations</p>
            </div>
            <span className="badge badge-red">{repeatOffenders.length} Flagged</span>
          </div>

          {repeatOffenders.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              ✨ No repeat non-compliant manufacturers recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {repeatOffenders.map((offender) => (
                <div
                  key={offender.mfg}
                  className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">
                      🏢 {offender.mfg}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Last Flagged: {new Date(offender.lastDate).toLocaleDateString()} • {offender.location}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="badge badge-red text-xs">
                      ⚠️ {offender.violations} Violation{offender.violations > 1 ? "s" : ""}
                    </span>
                    <div className="text-[11px] text-rose-700 font-semibold mt-1">
                      Action Recommended
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
