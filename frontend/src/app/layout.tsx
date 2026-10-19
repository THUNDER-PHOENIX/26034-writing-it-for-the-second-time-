import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Initializer } from "@/components/Initializer";

export const metadata: Metadata = {
  title: "LabelCheck · SIH 26034 Prototype",
  description: "Prototype decision support for screening packaged commodity labels. OCR findings require human review.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Initializer />
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        <footer className="bg-slate-50 border-t border-slate-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="font-semibold text-slate-800 mb-2">LabelCheck · SIH prototype</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A prototype screening tool for packaged commodity declarations. It is not an official Government of India service and does not determine legal compliance.
                </p>
              </div>
              <div>
                <div className="font-semibold text-slate-800 mb-2">Quick Links</div>
                <div className="space-y-1 text-xs text-slate-600">
                  <a className="hover:text-blue-700" href="https://consumeraffairs.nic.in/">• Department of Consumer Affairs</a>
                  <div>• Check the current Rules and amendments before enforcement use</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-800 mb-2">Prototype status</div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div>Demo sign-in only · not secure authentication</div>
                  <div>Scan history is stored per browser unless cloud storage is configured</div>
                  <div>OCR may miss or misread small print</div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 text-center">
              Not affiliated with or operated by the Government of India.
              <div className="mt-1">Built for Smart India Hackathon — Problem Statement 26034</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
