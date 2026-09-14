"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

export function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email: string; name?: string; role?: string } | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("lm_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }

    // Monitor online/offline status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("lm_user");
    setUser(null);
    window.location.reload();
  }

  const navItems = [
    { href: "/", label: "Dashboard", icon: "📊" },
    { href: "/scan", label: "Scan Product", icon: "📷" },
    { href: "/reports", label: "Reports", icon: "📋" },
    { href: "/analytics", label: "Analytics", icon: "📈" },
    { href: "/about", label: "About & Rules", icon: "ℹ️" },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      {/* Top Government Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-semibold">🇮🇳 Government of India</span>
            <span className="text-blue-200">|</span>
            <span>Department of Consumer Affairs</span>
            <span className="text-blue-200">|</span>
            <span className="text-blue-200 hidden sm:inline">Legal Metrology Division</span>
          </div>
          <div className="flex items-center gap-4 text-blue-100 text-xs">
            {/* Real-time sync status indicator */}
            <div className="flex items-center gap-1.5 bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-400/20">
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-[11px] font-medium text-blue-100">
                {isOnline ? "Field Online (Synced)" : "Offline Mode (Local Storage)"}
              </span>
            </div>
            <span className="hidden md:inline">Toll Free: 1800-11-4000</span>
            <span className="bg-blue-800 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
              SIH 2026 • PS 26034
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Logo size={48} />
          <div>
            <div className="font-bold text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
              Legal Metrology Compliance Portal
            </div>
            <div className="text-xs text-slate-500 leading-tight">
              Packaged Commodities (PCR) Rules, 2011 • Enforcement System
            </div>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Auth / Inspector Profile */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-800">
                  {user.name || user.email.split("@")[0]}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Inspector Active
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold grid place-items-center text-sm border border-blue-200">
                {(user.name || user.email)[0].toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-slate-500 hover:text-red-600 px-2.5 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                title="Logout"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium bg-blue-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Inspector Registration
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
