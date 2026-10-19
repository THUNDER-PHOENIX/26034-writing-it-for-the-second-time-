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
      <div className="bg-slate-900 text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-semibold">SIH 2026 Prototype</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 hidden sm:inline">Problem Statement 26034 · Packaged commodities</span>
          </div>
          <div className="flex items-center gap-4 text-blue-100 text-xs">
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-[11px] font-medium text-blue-100">
                {isOnline ? "Online · browser-local data" : "Offline · browser-local data"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Logo size={48} />
          <div>
            <div className="font-bold text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
              LabelCheck
            </div>
            <div className="text-xs text-slate-500 leading-tight">
              Packaged commodity screening · SIH 2026
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
                  Demo session
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
