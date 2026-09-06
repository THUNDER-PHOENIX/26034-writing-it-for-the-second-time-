export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">About this System</h1>
        <p className="text-slate-500 text-sm">Legal Metrology Compliance Checker — Smart India Hackathon, Problem Statement 26034</p>
      </div>

      <div className="card p-5 space-y-4 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold text-base">Purpose</h2>
          <p className="text-slate-600">
            This system automatically checks whether a packaged commodity's label complies with the
            <span className="font-medium"> Legal Metrology (Packaged Commodities) Rules, 2011</span> under
            the Legal Metrology Act, 2009. It scans a product image, extracts the printed text, and
            validates the mandatory declarations against the prescribed rules.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base">How it Works</h2>
          <ol className="list-decimal pl-5 text-slate-600 space-y-1">
            <li>The inspector uploads a clear image of the product label (or uses the in-app camera).</li>
            <li>The image is processed in the browser by <span className="font-mono">Tesseract.js</span>, an open-source OCR engine.</li>
            <li>The extracted text is fed to a rule engine that searches for the 12 mandatory declarations.</li>
            <li>Each declaration is marked OK, MINOR, MAJOR, or CRITICAL depending on presence and the rule it relates to.</li>
            <li>A compliance score and full rule-wise report is generated. Reports can be exported to PDF.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-semibold text-base">Mandatory Declarations Implemented</h2>
          <ul className="list-disc pl-5 text-slate-600 space-y-1">
            <li>Name &amp; address of manufacturer / packer / importer (Rule 6(1)(a))</li>
            <li>Net quantity in standard units (Rule 6(1)(b))</li>
            <li>Maximum Retail Price inclusive of all taxes (Rule 6(1)(c))</li>
            <li>Month and year of manufacture / packing / import (Rule 6(1)(d))</li>
            <li>Country of origin for imported goods (Rule 6(1)(e))</li>
            <li>Consumer care details (Rule 6(1)(f))</li>
            <li>Best before / expiry (Rule 6(1)(g), Rule 18)</li>
            <li>Ingredients for food (Rule 6(1)(h), Rule 42)</li>
            <li>Nutritional information (Rule 6(1)(i), Rule 42(2))</li>
            <li>Veg / Non-veg symbol (Rule 6(1)(j), Rule 33)</li>
            <li>Customer care email / phone (Rule 6(1)(f) r/w 35)</li>
            <li>Barcode / machine-readable code (industry practice)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base">Architecture</h2>
          <pre className="text-xs bg-slate-50 border rounded p-3 overflow-auto">
{`[Browser / Mobile Camera]
        │
        ▼
[Next.js Client (App Router)]
        │
        ├── Image capture / upload
        ├── Tesseract.js OCR  (in-browser WASM)
        │
        ▼
[Rule Engine (src/lib/rules.ts)]
        │
        ├── Regex patterns per declaration
        ├── Severity tagging (critical / major / minor)
        ├── Compliance score = weighted percentage
        │
        ▼
[Report Layer]
        ├── On-screen detailed view
        ├── jsPDF + autoTable → downloadable report
        └── LocalStorage history (Supabase-ready schema)
`}
          </pre>
        </section>

        <section>
          <h2 className="font-semibold text-base">Tech Stack</h2>
          <ul className="list-disc pl-5 text-slate-600 space-y-1">
            <li><span className="font-mono">Next.js 14</span> (App Router) + TypeScript</li>
            <li><span className="font-mono">Tesseract.js 5</span> for browser-side OCR</li>
            <li><span className="font-mono">jsPDF</span> + <span className="font-mono">jspdf-autotable</span> for PDF generation</li>
            <li><span className="font-mono">TailwindCSS</span> for styling</li>
            <li>LocalStorage for history (prototype); schema maps directly to Supabase / Postgres</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base">Production Roadmap (out of scope for prototype)</h2>
          <ul className="list-disc pl-5 text-slate-600 space-y-1">
            <li>Server-side OCR (Google Cloud Vision / AWS Textract) for higher accuracy on curved / low-contrast labels.</li>
            <li>Pixel-per-cm font size measurement using a reference object in the image. (Heuristic present, true pixel-per-cm via calibration card is the production version.)</li>
            <li>Multi-language OCR including Hindi and other Indian languages.</li>
            <li>Supabase + Row-Level Security for role-based access (Inspector / Admin / Public).</li>
            <li>Mobile native app (React Native) with offline-first sync.</li>
            <li>Configurable rules engine loaded from a JSON spec maintained by Legal Metrology officers.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base">Limitations</h2>
          <ul className="list-disc pl-5 text-slate-600 space-y-1">
            <li>OCR accuracy depends on image quality — glary, curved, or low-resolution labels reduce recall.</li>
            <li>Rule engine is regex / heuristic; the legal validity of a "violation" is advisory, not binding.</li>
            <li>LocalStorage is browser-local; data is not shared across devices in the prototype.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
