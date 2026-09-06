# Legal Metrology Compliance Checker

A web application that scans product labels and checks them for compliance with the **Legal Metrology (Packaged Commodities) Rules, 2011**.

Built for **Smart India Hackathon — Problem Statement 26034**.

---

## What it does

1. Inspector uploads / captures a photo of a product label.
2. Tesseract.js (browser-side OCR) extracts the printed text and per-word bounding boxes.
3. The rule engine checks the text against the **12 mandatory declarations** (regex + presence detection).
4. A separate font-size analyzer measures the height of each key declaration relative to the image and flags too-small text.
5. A compliance score, rule-wise findings, font-size table, and PDF report are produced.

No backend, no API keys, no billing — runs entirely in the browser. Data is stored in `localStorage`.

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| OCR | Tesseract.js 5 (WebAssembly) |
| PDF | jsPDF + jspdf-autotable |
| Styling | TailwindCSS |
| Storage | localStorage (Supabase-ready schema) |

---

## Setup

```bash
# 1. Install Node.js 18+ if you don't have it: https://nodejs.org

# 2. Install dependencies
npm install

# 3. Run the dev server
npm run dev

# 4. Open the app
# http://localhost:3000
```

That's it. No `.env`, no API keys, no database setup.

---

## Pages

- `/` — Dashboard (stats, charts, recent violations)
- `/scan` — Upload or capture a product image, run OCR
- `/reports` — List of all scans, search & filter
- `/reports/[id]` — Detailed compliance report + PDF download
- `/about` — Architecture, rules implemented, limitations

---

## Demo flow (for judges)

1. Go to `/scan` → click **"Try a sample"** (generates a compliant test image instantly).
2. Click **"Run Compliance Check"** — OCR runs in the browser, extracts text in ~5–10 seconds.
3. The result page shows a green **COMPLIANT** score (~92%) with all 12 declarations checked.
4. Click **"New Scan"** and try the camera with a real product from your kitchen.
5. Download the **PDF report** from the result page.
6. Open `/` to see the dashboard with the scan logged.

**For a non-compliant demo**: capture a product that's missing the MRP, or take a photo of just a part of a label so several fields are missing.

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx        # Header + nav + global wrapper
│   ├── page.tsx          # Dashboard
│   ├── scan/page.tsx     # Image upload + OCR + save
│   ├── reports/
│   │   ├── page.tsx      # All scans list
│   │   └── [id]/page.tsx # Single report detail
│   ├── about/page.tsx    # Architecture & docs (in-app)
│   └── globals.css
└── lib/
    ├── rules.ts          # Rule engine + regex for 12 declarations
    ├── storage.ts        # localStorage CRUD + seed data
    └── pdf.ts            # PDF report generator
```

---

## The 12 mandatory declarations (implemented in `src/lib/rules.ts`)

1. Name & address of manufacturer / packer / importer
2. Net quantity (g, kg, ml, L)
3. MRP inclusive of all taxes
4. Month & year of manufacture / packing
5. Country of origin (imported goods)
6. Consumer care details
7. Best before / expiry date (food)
8. Ingredients (food)
9. Nutritional information (food)
10. Veg / Non-veg symbol
11. Customer care email / phone
12. Barcode / machine-readable code

---

## Deployment

The project is a standard Next.js app and can be deployed to Vercel in one click:

```bash
npm i -g vercel
vercel
```

For production hardening, replace `localStorage` with Supabase (schema is identical to `src/lib/storage.ts` types).

---

## Team

Built for SIH 2026 — see `about` page in the running app for full architecture and limitations.
