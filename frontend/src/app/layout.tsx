import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LM Compliance Checker",
  description: "Automated compliance checking for packaged commodities under Legal Metrology (Packaged Commodities) Rules, 2011",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 grid place-items-center text-white font-bold">LM</div>
              <div>
                <div className="font-semibold leading-tight">Compliance Checker</div>
                <div className="text-xs text-slate-500 leading-tight">Packaged Commodities Rules, 2011</div>
              </div>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/" className="px-3 py-2 rounded-md hover:bg-slate-100">Dashboard</Link>
              <Link href="/scan" className="px-3 py-2 rounded-md hover:bg-slate-100">Scan</Link>
              <Link href="/reports" className="px-3 py-2 rounded-md hover:bg-slate-100">Reports</Link>
              <Link href="/about" className="px-3 py-2 rounded-md hover:bg-slate-100">About</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="max-w-6xl mx-auto px-4 py-6 text-xs text-slate-500">
          Built for Smart India Hackathon — Problem Statement 26034. Tool-assisted prototype.
        </footer>
      </body>
    </html>
  );
}
