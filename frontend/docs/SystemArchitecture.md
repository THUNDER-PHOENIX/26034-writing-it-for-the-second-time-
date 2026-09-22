# System Architecture

## Overview
The Legal Metrology Compliance Checker is a web-based inspection tool designed to automate the compliance validation of packaged commodities against the Legal Metrology (Packaged Commodities) Rules 2011.

## High-Level Architecture
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS.
- **OCR Pipeline**: 
  - **Primary**: Cloud-based OCR.space Engine 2.
  - **Fallback**: Client-side Tesseract.js (WASM) with pre-processing via Browser Canvas (Grayscale, Contrast, Blur, Sharpen).
- **Compliance Rules Engine**: Pattern-based regex validation engine.
- **Storage**: Hybrid Local-Remote Architecture.
  - **Local**: `localStorage`.
  - **Remote**: Supabase (Postgres & Object Storage).
  - **Dispatcher**: `src/lib/storage/anywhere.ts` seamlessly handles the sync.

## Key Components

### 1. Compliance Rule Engine (`rules.ts`)
Validates declarations (MRP, Net Qty, Mfg Date, etc.) using context-aware normalization.

### 2. OCR Preprocessing (`image/preprocess.ts`)
Standardizes image format for high-accuracy recognition.

### 3. Storage (`storage.ts`)
- `ScanRecord` interface defines the core entity.
- Supports CRUD operations with remote-first sync and local fallback.

## Deployment Guidelines
1.  **Frontend**: Deployed on Vercel/Netlify.
2.  **Environment Variables**:
    *   `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase API key.
    *   `OCR_SPACE_API_KEY`: OCR.space API key.
3.  **Storage**: Supabase 'scans' table and 'scans' bucket.
