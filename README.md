# Legal Metrology Compliance Checker — SIH 26034

A web application that scans product labels and checks them for compliance with the **Legal Metrology (Packaged Commodities) Rules, 2011**.

Built for **Smart India Hackathon — Problem Statement 26034**.

> All application code lives in [`frontend/`](./frontend). See [`frontend/README.md`](./frontend/README.md) for setup, demo, and architecture details.

## Repo layout

```
.
├── frontend/        ← Next.js 14 app (this is what you run / deploy)
└── README.md        ← (this file)
```

## Quick start

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000.

## Demo flow (60 seconds)

1. Open `/scan` → click **"Try a sample"** (loads a test image instantly)
2. Click **"Run Compliance Check"** — OCR runs in the browser, ~5–10s
3. See the green **COMPLIANT** score (91% on the sample)
4. Click **"Download PDF"** for the official-looking report
5. Open `/` for the dashboard view

## Tech stack

- **Next.js 14** (App Router) + TypeScript
- **Tesseract.js 5** (browser-side OCR, no API keys)
- **jsPDF** + autoTable (PDF generation)
- **TailwindCSS** (styling)
- **localStorage** (history — Supabase-ready schema)

## Team

SIH 2026 — Problem Statement 26034
