export default function AboutPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">SIH 2026 · Problem Statement 26034</div>
        <h1 className="mt-1 text-2xl font-semibold">About LabelCheck</h1>
        <p className="mt-1 text-sm text-slate-500">A prototype for scanning package labels and organizing inspection evidence.</p>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>Prototype notice.</strong> This is not a Government of India service or an authoritative legal checker. OCR can miss or misread text. Treat every result as a lead for human review against the current rules and the complete package.
      </div>

      <section className="card p-5 space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">Current workflow</h2>
        <ol className="list-decimal pl-5 text-slate-600 space-y-1">
          <li>Upload a label photo or capture one with the device camera.</li>
          <li>Image quality checks flag low resolution, poor lighting, and blur.</li>
          <li>OCR uses the hosted OCR.space service when configured; otherwise it runs in the browser with Tesseract.js. Sparse scans also get a second pass over enlarged, overlapping image crops.</li>
          <li>Text patterns screen for selected declarations. Barcode decoding is supporting product-identification data, not a required legal declaration.</li>
          <li>Review the scan record, correct the OCR transcript, add notes, and export a PDF.</li>
        </ol>
      </section>

      <section className="card p-5 space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">What the prototype checks</h2>
        <p className="text-slate-600">The rule engine screens for manufacturer/packer/importer details, net quantity, MRP, manufacture or packing date, consumer-care contact, and selected category-dependent food declarations. It can also detect an origin statement and decode a barcode. These checks are incomplete and should not be read as the full statutory checklist.</p>
        <p className="text-slate-600">The system does not reliably validate declaration placement, dimensions in statutory units, all product-specific exceptions, online listing content, misleading claims, or the full set of amendments. Its image-relative text-height estimate is only a visual heuristic and is not a legal font-size measurement.</p>
        <a className="font-medium text-blue-700 hover:underline" href="https://consumeraffairs.nic.in/" target="_blank" rel="noreferrer">Check the Department of Consumer Affairs for current rules and amendments ↗</a>
      </section>

      <section className="card p-5 space-y-3 text-sm leading-relaxed">
        <h2 className="font-semibold text-base">Storage, access, and deployment</h2>
        <ul className="list-disc pl-5 text-slate-600 space-y-1">
          <li>Without cloud credentials, scans are stored in the current browser only. Online status does not mean records are synced.</li>
          <li>Optional Supabase storage exists, but role-based access and secure inspector authentication are not implemented. Sign-in and registration are demo flows only.</li>
          <li>Hosted OCR requires the server-side <code>OCR_SPACE_API_KEY</code>; the browser fallback works without it but may be slower or less accurate.</li>
          <li>When OCR misses small print, use a close-up image of each panel, review/correct the extracted transcript, and keep the original package photo as evidence.</li>
        </ul>
      </section>
    </div>
  );
}
