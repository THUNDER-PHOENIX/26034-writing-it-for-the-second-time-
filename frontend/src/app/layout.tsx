import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Legal Metrology Compliance Portal",
  description: "Automated compliance checking for packaged commodities under Legal Metrology (Packaged Commodities) Rules, 2011",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        <footer className="bg-slate-50 border-t border-slate-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="font-semibold text-slate-800 mb-2">Legal Metrology Portal</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automated compliance system for packaged commodities under Legal Metrology Act, 2009 and Packaged Commodities Rules, 2011.
                </p>
              </div>
              <div>
                <div className="font-semibold text-slate-800 mb-2">Quick Links</div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div>• Legal Metrology Act, 2009</div>
                  <div>• Packaged Commodities Rules, 2011</div>
                  <div>• Consumer Affairs Department</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-800 mb-2">Support</div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div>📧 support@legalmetrology.gov.in</div>
                  <div>📞 1800-11-4000 (Toll Free)</div>
                  <div>🕒 Mon-Fri, 9:00 AM - 6:00 PM IST</div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 text-center">
              © 2026 Government of India · Department of Consumer Affairs · Legal Metrology Division
              <div className="mt-1">Built for Smart India Hackathon — Problem Statement 26034</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
