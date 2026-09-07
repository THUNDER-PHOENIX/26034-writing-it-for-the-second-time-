# Legal Metrology Compliance Checker — SIH 26034

A web application that scans product labels and checks them for compliance with the **Legal Metrology (Packaged Commodities) Rules, 2011**.

Built for **Smart India Hackathon — Problem Statement 26034**.

> All application code lives in [`frontend/`](./frontend). See [`frontend/README.md`](./frontend/README.md) for setup, demo, and architecture details.

## Repo layout

```
.
├── frontend/            ← Next.js 14 app (this is what you run / deploy)
├── opencode-writing-my-code/   ← original SIH write-up (gitlink)
└── README.md            ← (this file)
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
2. Click **"Run Compliance Check"** — OCR runs (~5–10s)
3. See the green **COMPLIANT** score (91% on the sample)
4. Click **"Download PDF"** for the official-looking report
5. Open `/` for the dashboard view

## Tech stack

- **Next.js 14** (App Router) + TypeScript
- **OCR.space** server-side OCR (free tier, 25k req/month, no credit card) with **Tesseract.js 5** as offline fallback
- **jimp** in-browser image preprocessing (resize, grayscale, contrast stretch, sharpen) before OCR
- **ZXing-js** barcode scanner (decodes EAN-8/12/13, UPC, Code-128, QR)
- **Supabase** for cross-device persistence + image storage (Postgres + Storage bucket), with localStorage fallback
- **jsPDF** + autoTable (PDF generation)
- **TailwindCSS** (styling)
- **Per-category rule model** (food / beverage / cosmetic / drug / consumer-good) so the score reflects what *should* be on the product

## Deployment

The project is configured for one-click Vercel deployment:

- `frontend/vercel.json` pins to the `bom1` (Mumbai) region
- `frontend/.env.example` documents the required environment variables
- The OCR API route has a 30-second timeout declared inline

## Team

SIH 2026 — Problem Statement 26034
